var fs = require("fs").promises;
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { stringify } from "ts-jest";
import axios from "axios";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  uploadString,
  uploadBytes,
} from "firebase/storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { firebaseConfig } from "../config";
const sharp = require("sharp");

const prisma = new PrismaClient();
!getApps().length ? initializeApp(firebaseConfig) : getApp();

const execute = async function () {
  const fileContent = await fs.readFile("src/scripts/Recs_mobile.csv");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const convertedRecords = records.map((record: any) => {
    return {
      ...record,
      seasonalColors: record.seasonalColors.split(", "),
      occasions: record.occasions.split(", "),
      kibbeTypes: record.kibbeTypes.split(", "),
      upvotes: parseInt(record.upvotes, 10),
      downvotes: parseInt(record.downvotes, 10),
    };
  });

  const outfit = await prisma.outfit.createMany({
    data: convertedRecords,
  });
};
// execute();

const kibbeMappings = {
  Dramatic: "Queen",
  "Dramatic Classic": "Boss",
  "Flamboyant Gamine": "Coquette",
  "Flamboyant Natural": "Supermodel",
  Romantic: "Siren",
  "Soft Classic": "Lady",
  "Soft Dramatic": "Feline",
  "Soft Gamine": "Ingenue",
  "Soft Natural": "Vixen",
  "Theatrical Romantic": "Femme Fatale",
} as any;

const convert = async function () {
  const outfits = await prisma.outfit.findMany();

  const convertedOutfits = outfits.map((outfit: any) => {
    const modusTypes = outfit.kibbeTypes.map((type: string) => {
      console.log(type, kibbeMappings[type]);
      return kibbeMappings[type];
    });
    return {
      id: outfit.id,
      kibbeTypes: modusTypes,
    };
  });

  for (let i = 0; i < convertedOutfits.length; i++) {
    const outfit = convertedOutfits[i];
    await prisma.outfit.update({
      where: {
        id: outfit.id,
      },
      data: {
        kibbeTypes: outfit.kibbeTypes,
      },
    });
  }
};

// convert();

async function constraintImage(
  buffer: any,
  quality = 100,
  drop = 10
): Promise<any> {
  const done = await sharp(buffer)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({
      quality,
      mozjpeg: true,
    })
    .toBuffer();

  if (done.byteLength > 30000) {
    return constraintImage(buffer, quality - drop);
  }

  return done;
}

const optimizeImage = async (url: string) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "binary");
    const optimizedBuffer = await constraintImage(buffer);
    //   .resize({ width: 300 })
    //   .toBuffer();

    // upload image to firebase
    const uuid = uuidv4();
    const fileRef = ref(getStorage(), uuid);
    await uploadBytes(fileRef, optimizedBuffer);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (e) {
    console.log(`upload failed ${e}`);
  }
};

const optimizeImages = async function () {
  const outfits = await prisma.outfit.findMany();

  // const filteredOutfits = outfits.filter((outfit: any, index: number) => {
  //   return !outfit.images[0].includes("firebase");
  // });

  const convertedOutfits = [] as any;

  for (let i = 0; i < outfits.length; i++) {
    const filteredOutfit = outfits[i] as any;
    const optimizedImages = [];
    for (let j = 0; j < filteredOutfit.images.length; j++) {
      const imageUrl = filteredOutfit.images[j];
      const optimizedImageUrl = await optimizeImage(imageUrl);
      optimizedImages.push(optimizedImageUrl);
    }
    filteredOutfit.images = optimizedImages;
    convertedOutfits.push(filteredOutfit);
  }

  for (let i = 0; i < convertedOutfits.length; i++) {
    const outfit = convertedOutfits[i];
    await prisma.outfit.update({
      where: {
        id: outfit.id,
      },
      data: {
        images: outfit.images,
      },
    });
  }
};

// optimizeImages();

// const optimizeUserImages = async function () {
//   const users = await prisma.user.findMany();

//   const convertedUsers = [] as any;

//   for (let i = 0; i < users.length; i++) {
//     const filteredUser = users[i] as any;
//     const optimizedImages = [];
//     for (let j = 0; j < filteredUser.images.length; j++) {
//       const imageUrl = filteredUser.images[j];
//       const optimizedImageUrl = await optimizeImage(imageUrl);
//       optimizedImages.push(optimizedImageUrl);
//     }
//     filteredUser.images = optimizedImages;
//     convertedUsers.push(filteredUser);
//   }

//   for (let i = 0; i < convertedUsers.length; i++) {
//     const user = convertedUsers[i];
//     await prisma.user.update({
//       where: {
//         id: user.id,
//       },
//       data: {
//         images: user.images,
//       },
//     });
//   }
// }