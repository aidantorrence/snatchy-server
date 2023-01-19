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

  await prisma.outfit.createMany({
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
      // console.log(type, kibbeMappings[type]);
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
  byteSize = 100000,
  stack = 0,
  quality = 100,
  drop = 10,
): Promise<any> {
  const done = await sharp(buffer)
    .resize({ width: 450, withoutEnlargement: true })
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

const optimizeImage = async (url: string, byteSize = 100000) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "binary");
    const optimizedBuffer = await constraintImage(buffer, byteSize);

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
    const imagesOptimized = [];
    const imagesThumbnails = [];
    for (let j = 0; j < filteredOutfit.images.length; j++) {
      const imageUrl = filteredOutfit.images[j];
      const imageOptimized = await optimizeImage(imageUrl, 100000);
      const imageThumbnail = await optimizeImage(imageUrl, 30000);
      imagesOptimized.push(imageOptimized);
      imagesThumbnails.push(imageThumbnail);
    }
    filteredOutfit.imagesOptimized = imagesOptimized;
    filteredOutfit.imagesThumbnails = imagesThumbnails;
    // console.log('filteredOutfit', filteredOutfit)
    convertedOutfits.push(filteredOutfit);
  }

  for (let i = 0; i < convertedOutfits.length; i++) {
    const outfit = convertedOutfits[i];
    await prisma.outfit.update({
      where: {
        id: outfit.id,
      },
      data: {
        imagesOptimized: outfit.imagesOptimized,
        imagesThumbnails: outfit.imagesThumbnails,
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

const convertSeasonalColors = async function () {
  const outfits = await prisma.outfit.findMany();

  const convertedOutfits = outfits.map((outfit: any) => {
    const seasonalColors: string[] = outfit.seasonalColors.map((seasonalColor: string) => {
      return seasonalColor.split(' ')?.at(-1);
    });
    const seasonalColorsDupesRemoved = [...new Set(seasonalColors)];
    return {
      id: outfit.id,
      seasonalColors: seasonalColorsDupesRemoved,
    };
  });
  console.log(convertedOutfits);

  for (let i = 0; i < convertedOutfits.length; i++) {
    const outfit = convertedOutfits[i];
    await prisma.outfit.update({
      where: {
        id: outfit.id,
      },
      data: {
        seasonalColors: outfit.seasonalColors,
      },
    });
  }
};

// convertSeasonalColors();

const convertExistingKibbeTypes = async function () {
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

  const outfits = await prisma.outfit.findMany();
  // console.log('outfits', outfits)

  const convertedOutfits = outfits?.map((outfit: any) => {
    if (convertedRecords.find((record: any) => record.description === outfit.description)) {
      const record = convertedRecords.find((record: any) => record.description === outfit.description);
      // console.log('record', record);
    return {
      id: outfit.id,
      kibbeTypes: record.kibbeTypes,
    };
    } else {
      return null
    }
  }).filter((outfit: any) => outfit !== null);

  // console.log('convertedOutfits', convertedOutfits);

  for (let i = 0; i < convertedOutfits.length; i++) {
    const outfit = convertedOutfits[i];
    await prisma.outfit.update({
      where: {
        id: outfit?.id,
      },
      data: {
        kibbeTypes: outfit?.kibbeTypes,
      },
    });
  }
};

convertExistingKibbeTypes();