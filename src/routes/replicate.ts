import Router from "express-promise-router";
import axios from "axios";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { firebaseConfig } from "../config";
import { Configuration, OpenAIApi } from "openai";
import { PrismaClient } from "@prisma/client";
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
  const { id, downloadUrl } = req.body;

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
    },
    model: "aidantorrence/dreambooth",
    trainer_version:
      "cd3f925f7ab21afaef7d45224790eedbb837eeac40d22e8fefe015489ab644aa",
  };
  try {
    const { data } = await axios.post(
      "https://dreambooth-api-experimental.replicate.com/v1/trainings",
      body,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      }
    );

    await prisma.training.update({
      where: {
        id,
      },
      data: {
        replicateId: data.id,
      },
    });

    res.status(200).send(data);
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

// stableDiffusion.post("/dreambooth-file-upload", async (req, res) => {
//   try {
//     let zip = new AdmZip();
//     // zip.addLocalFile("./files/cropped-aidan-1.png");
//     // zip.addLocalFile("./files/cropped-aidan-2.png");
//     // zip.addLocalFile("./files/cropped-aidan-3.png");
//     // zip.addLocalFile("./files/cropped-aidan-4.png");
//     // zip.addLocalFile("./files/cropped-aidan-5.png");
//     // zip.addLocalFile("./files/cropped-aidan-6.png");
//     // zip.addLocalFile("./files/cropped-aidan-7.png");
//     // zip.addLocalFile("./files/cropped-aidan-8.png");
//     // zip.addLocalFile("./files/cropped-aidan-9.png");
//     // zip.addLocalFile("./files/cropped-aidan-10.png");
//     // zip.addLocalFile("./files/cropped-aidan-11.png");
//     // zip.addLocalFile("./files/cropped-aidan-12.png");
//     // zip.addLocalFile("./files/cropped-aidan-13.png");
//     zip.addLocalFile(
//       "./files/generated_photos_5e011b607b1b30000702f671.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e680ad66d3b380006d5dcfb.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e683be56d3b380006e0a707.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e685d416d3b380006e82f67.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e6835c16d3b380006df4fc5.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e6839e36d3b380006e03525.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e68019e6d3b380006d3c615.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e68210c6d3b380006dad933.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e6839086d3b380006e005e1.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e6848346d3b380006e36db1.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e6859006d3b380006e73b13.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e011b607b1b30000702f671.jpg.jpg"
//     );
//     zip.addLocalFile(
//       "./files/generated_photos_5e6859886d3b380006e7595b.jpg.jpg"
//     );
//     const zipFileContents = zip.toBuffer();

//     const uuid = uuidv4();
//     const fileRef = ref(getStorage(), uuid + ".zip");
//     await uploadBytes(fileRef, zipFileContents);
//     const downloadUrl = await getDownloadURL(fileRef);

//     // const { data } = await axios.post('https://dreambooth-api-experimental.replicate.com/v1/upload/data.zip', zipFileContents, { headers: {
//     //   Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
//     // } });
//     res.status(200).send("success");
//   } catch (e) {
//     console.log(e);
//     res.status(400).send(e);
//   }
// });

// stableDiffusion.post("/dreambooth-train", async (req, res) => {
//   const body = {
//     input: {
//       instance_prompt: "photo of sks woman",
//       class_prompt: "photo of woman",
//       instance_data:
//         "https://firebasestorage.googleapis.com/v0/b/instaheat-dda39.appspot.com/o/106039f7-2a1d-4c5f-8920-ce27a3fbdef2.zip?alt=media&token=fa0e60ba-5922-4115-9b4f-dc8fa11f08e4",
//       max_train_steps: 2000,
//       num_class_images: 200,
//       learning_rate: 1e-6,
//       seed: 1337,
//       adam_beta1: 0.9,
//       adam_beta2: 0.999,
//       resolution: 512,
//       adam_epsilon: 1e-8,
//       lr_scheduler: "constant",
//       max_grad_norm: 1,
//       n_save_sample: 4,
//       num_train_epochs: 1,
//       save_infer_steps: 50,
//       train_batch_size: 1,
//       adam_weight_decay: 0.01,
//       prior_loss_weight: 1,
//       sample_batch_size: 4,
//       train_text_encoder: true,
//       save_guidance_scale: 7.5,
//       with_prior_preservation: true,
//       gradient_accumulation_steps: 1,
//     },
//     model: "aidantorrence/dreambooth",
//     trainer_version:
//       "cd3f925f7ab21afaef7d45224790eedbb837eeac40d22e8fefe015489ab644aa",
//   };
//   try {
//     const { data } = await axios.post(
//       "https://dreambooth-api-experimental.replicate.com/v1/trainings",
//       body,
//       {
//         headers: {
//           Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
//         },
//       }
//     );
//     res.status(200).send(data);
//   } catch (e) {
//     console.log(e);
//     res.status(400).send(e);
//   }
// });

// stableDiffusion.get("/dreambooth-training/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const { data } = await axios.get(
//       `https://dreambooth-api-experimental.replicate.com/v1/trainings/${id}`,
//       {
//         headers: {
//           Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
//         },
//       }
//     );
//     res.status(200).send(data);
//   } catch (e) {
//     console.log(e);
//     res.status(400).send(e);
//   }
// });

stableDiffusion.get("/dreambooth-prediction/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data } = await axios.get(
      "https://api.replicate.com/v1/predictions/" + id,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.get("/dreambooth-predictions", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.replicate.com/v1/predictions?cursor=cD0yMDIzLTAxLTAyKzA2JTNBMTclM0EyOS42MTMxNzIlMkIwMCUzQTAw",
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.get("/dreambooth-trainings", async (req, res) => {
  const email = req.query.email as string;
  const user = await prisma.websiteUser.findUnique({
    where: {
      email,
    },
  });
  try {
    const trainings = await prisma.training.findMany({
      where: {
        userId: user?.id,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });
    res.status(200).send(trainings);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.post("/stable-diffusion-predict", async (req, res) => {
  const { prompts, outfit, celebrity, uid } = req.body;
  try {
    for (let i = 0; i < prompts.length * 2; i++) {
      await axios.post(
        "https://api.replicate.com/v1/predictions",
        {
          version:
            "5b703f0fa41880f918ab1b12c88a25b468c18639be17515259fb66a83f4ad0a4",
          input: {
            prompt: `${celebrity} ${prompts[i % prompts.length]}`,
            init_image: outfit,
            num_outputs: 4,
          },
          webhook_completed:
            `https://5f28-104-139-116-146.ngrok.io/webhook-sd-prediction?uid=${uid}`,
        },
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          },
        }
      );
    }
    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

stableDiffusion.post("/webhook-sd-prediction", async (req, res) => {
  const { uid } = req.query;
  console.log('uid', uid)
  console.log('req.body', req.body)
  try {
    const { input, id: replicateId, output } = req.body;

    await prisma.mobilePrediction.create({
      data: {
        ownerId: uid as string,
        prompt: input.prompt,
        replicateId,
        images: {
          create: output.map((image: any) => {
            return { imageUrl: image };
          }),
        },
      },
    });

    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

export default stableDiffusion;
