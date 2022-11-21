var fs = require('fs').promises;
import { PrismaClient } from "@prisma/client";
import { parse } from 'csv-parse/sync';
import { stringify } from "ts-jest";

const prisma = new PrismaClient();

const execute = async function () {
    const fileContent = await fs.readFile('src/scripts/Recs_mobile.csv');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const convertedRecords = records.map((record: any) => {
      return {
        ...record,
        seasonalColors: record.seasonalColors.split(', '),
        occasions: record.occasions.split(', '),
        kibbeTypes: record.kibbeTypes.split(', '),
        upvotes: parseInt(record.upvotes, 10),
        downvotes: parseInt(record.downvotes, 10),
      }
    })

    const outfit = await prisma.outfit.createMany({
      data: convertedRecords,
    });

    console.log(outfit);

}
execute();

const kibbeMappings = {
    Dramatic: 'Queen',
    'Dramatic Classic': 'Boss',
    'Flamboyant Gamine': 'Coquette',
    'Flamboyant Natural': 'Supermodel',
    'Romantic': 'Siren',
    'Soft Classic': 'Lady',
    'Soft Dramatic': 'Feline',
    'Soft Gamine': 'Ingenue',
    'Soft Natural': 'Vixen',
    'Theatrical Romantic': 'Femme Fatale',
} as any;

const convert = async function () {
  const outfits = await prisma.outfit.findMany();

  const convertedOutfits = outfits.map((outfit: any) => {
    const modusTypes = outfit.kibbeTypes.map((type: string) => {
      console.log(type, kibbeMappings[type])
      return kibbeMappings[type]
    })
    return {
      id: outfit.id,
      kibbeTypes: modusTypes,
    }
  });

  for (let i = 0; i < convertedOutfits.length; i++) {
    const outfit = convertedOutfits[i];
    await prisma.outfit.update({
      where: {
        id: outfit.id,
      },
      data: {
        kibbeTypes: outfit.kibbeTypes,
      }
    });
  }
}

// convert();