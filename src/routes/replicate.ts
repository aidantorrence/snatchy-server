import Router from "express-promise-router";
import axios from "axios";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { firebaseConfig } from "../config";
import { Configuration, OpenAIApi } from "openai";
import { PrismaClient } from "@prisma/client";
import { createNoSubstitutionTemplateLiteral } from "typescript";
const sharp = require("sharp");

const prisma = new PrismaClient();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const stableDiffusion = Router();
!getApps().length ? initializeApp(firebaseConfig) : getApp();

const multer = require("multer");

var AdmZip = require("adm-zip");

const upload = multer();

async function constraintImage(
  buffer: any,
  byteSize = 100000,
  stack = 0,
  quality = 100,
  drop = 10
): Promise<any> {
  const done = await sharp(buffer)
    .resize({ width: 512, withoutEnlargement: true })
    .jpeg({
      quality,
      mozjpeg: true,
    })
    .toBuffer();
  if (done.byteLength > byteSize && stack < 10) {
    return constraintImage(buffer, byteSize, stack + 1, quality - drop);
  }

  return done;
}

stableDiffusion.post(
  "/dreambooth-training-upload",
  upload.array("files"),
  async (req, res) => {
    try {
      let zip = new AdmZip();
      const images = [] as string[];
      if (Array.isArray(req?.files)) {
        for (const file of req.files) {
          const optimizedBuffer = await constraintImage(file.buffer, 100000);
          const uuid = uuidv4();
          const fileRef = ref(getStorage(), uuid + ".jpg");
          await uploadBytes(fileRef, optimizedBuffer);
          const downloadUrl = await getDownloadURL(fileRef);
          images.push(downloadUrl);
          zip.addFile(file.originalname, optimizedBuffer);
        }
      }

      const zipFileContents = zip.toBuffer();

      const uuid = uuidv4();
      const fileRef = ref(getStorage(), uuid + ".zip");
      await uploadBytes(fileRef, zipFileContents);
      const downloadUrl = await getDownloadURL(fileRef);

      const user = await prisma.websiteUser.findUnique({
        where: {
          email: req.body.email,
        },
      });

      let training;
      if (user) {
        training = await prisma.training.upsert({
          where: {
            uid: req.body.uid,
          },
          update: {
            userId: user?.id,
            images,
            imageZip: downloadUrl,
          },
          create: {
            uid: req.body.uid,
            userId: user?.id,
            images,
            imageZip: downloadUrl,
          },
        });
      }
      res.status(200).send(training);
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  }
);

stableDiffusion.post("/dreambooth-training", async (req, res) => {
  const { outfit, prompts, themes, celebrity, uid, images } = req.body;
  console.log({ outfit: outfit, 
  prompts:  prompts,
  themes:  themes,
  celebrity:  celebrity,
  uid:  uid,
  images: images, }
  )

  let zip = new AdmZip();
  for (const image of images) {
    const { data } = await axios.get(image, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(data, 'binary');
    const optimizedBuffer = await constraintImage(buffer, 100000);
    zip.addFile('images', optimizedBuffer);
  }

  const zipFileContents = zip.toBuffer();

  const uuid = uuidv4();
  const fileRef = ref(getStorage(), uuid + ".zip");
  await uploadBytes(fileRef, zipFileContents);
  const downloadUrl = await getDownloadURL(fileRef);

  const body = {
    input: {
      instance_prompt: "photo of sks person",
      class_prompt: "photo of person",
      instance_data: downloadUrl,
      max_train_steps: 2000,
      num_class_images: 200,
      learning_rate: 1e-6,
      seed: 1337,
      adam_beta1: 0.9,
      adam_beta2: 0.999,
      resolution: 512,
      adam_epsilon: 1e-8,
      lr_scheduler: "constant",
      max_grad_norm: 1,
      n_save_sample: 4,
      num_train_epochs: 1,
      save_infer_steps: 50,
      train_batch_size: 1,
      adam_weight_decay: 0.01,
      prior_loss_weight: 1,
      sample_batch_size: 4,
      train_text_encoder: true,
      save_guidance_scale: 7.5,
      with_prior_preservation: true,
      gradient_accumulation_steps: 1,
      ckpt_base: 'https://huggingface.co/prompthero/openjourney-v2/resolve/main/openjourney-v2.ckpt',
    },
    model: "aidantorrence/dreambooth",
    trainer_version:
      "9c41656f8ae2e3d2af4c1b46913d7467cd891f2c1c5f3d97f1142e876e63ed7a",
  };
  try {
    // const { data } = await axios.post(
    //   "https://dreambooth-api-experimental.replicate.com/v1/trainings",
    //   body,
    //   {
    //     headers: {
    //       Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
    //     },
    //   }
    // );

    // await prisma.mobileTraining.create({
    //   data: {
    //     replicateId: data.id,
    //     images,
    //   },
    // });

    // res.status(200).send(data);
    res.status(200).send('success');
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.patch("/dreambooth-training", async (req, res) => {
  const { id } = req.body;
  const training = await prisma.training.findUnique({
    where: {
      id,
    },
  });

  try {
    const { data } = await axios.get(
      `https://dreambooth-api-experimental.replicate.com/v1/trainings/${training?.replicateId}`,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      }
    );

    const updatedTraining = await prisma.training.update({
      where: {
        id: req.body.id,
      },
      data: { version: data.version },
    });

    res.status(200).send(updatedTraining);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.post("/stable-diffusion-predict", async (req, res) => {
  const { prompts, themes, outfit, celebrity, uid } = req.body;
  const predictions = [];
  try {
    for (let i = 0; i < prompts.length * 2; i++) {
      const { data } = await axios.post(
        "https://api.replicate.com/v1/predictions",
        {
          version:
            "5b703f0fa41880f918ab1b12c88a25b468c18639be17515259fb66a83f4ad0a4",
          input: {
            prompt: `${celebrity} ${prompts[i % prompts.length]}`,
            prompt_strength: 0.65,
            init_image: outfit,
            num_outputs: 4,
            guidance_scale: 7.5,
          },
          webhook_completed: `${process.env.SERVER_URL}/webhook-sd-prediction?uid=${uid}`,
        },
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          },
        }
      );
      const prediction = await prisma.mobilePrediction.create({
        data: {
          ownerId: uid as string,
          prompt: prompts[i % prompts.length],
          replicateId: data.id,
          theme: themes[i % themes.length].name,
        },
      });
      predictions.push(prediction);
    }
    res.status(200).send(predictions);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.post("/stable-diffusion-train", async (req, res) => {
  const { prompts, themes, outfit, celebrity, uid } = req.body;
  const predictions = [];
  try {
    for (let i = 0; i < prompts.length * 2; i++) {
      const prediction = await prisma.mobilePrediction.create({
        data: {
          ownerId: uid as string,
          prompt: prompts[i % prompts.length],
          theme: themes[i % themes.length].name,
        },
      });
      predictions.push(prediction);
    }
    res.status(200).send(predictions);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.post("/webhook-sd-prediction", async (req, res) => {
  const { uid } = req.query;
  try {
    const { input, id: replicateId, output } = req.body;
    const prediction = await prisma.mobilePrediction.update({
      where: {
        replicateId,
      },
      data: {
        images: {
          create: output.map((image: any) => {
            return { imageUrl: image };
          }),
        },
      },
    });
    res.status(200).send(prediction);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.get("/prediction-results", async (req, res) => {
  const { ids } = req.query as { ids: string[] };
  try {
    const predictions = await prisma.mobilePrediction.findMany({
      include: {
        images: true,
      },
      where: {
        id: {
          in: ids?.map((id) => parseInt(id, 10)) as number[],
        },
      },
    });
    res.status(200).send(predictions);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.patch("/prediction-images", async (req, res) => {
  const { ids, data } = req.body;
  try {
    const predictions = await prisma.mobilePredictionImage.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data,
    });
    res.status(200).send(predictions);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.get("/prediction-images/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    const images = await prisma.mobilePredictionImage.findMany({
      where: { prediction: { ownerId: uid }, isSaved: true },
      include: { prediction: true },
      orderBy: {
        id: "desc",
      },
    });
    res.status(200).send(images);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

export default stableDiffusion;
