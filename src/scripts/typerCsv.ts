var fs = require('fs').promises;
import { PrismaClient } from "@prisma/client";
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

(async function () {
    const fileContent = await fs.readFile('src/scripts/typerFirst.csv');

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

    // const records = [] as any;
    // const parser = parse({
    //   delimiter: ','
    // });
    // // Use the readable stream api to consume records
    // parser.on('readable', function(){
    //   let record;
    //   while ((record = parser.read()) !== null) {
    //     records.push(record);
    //   }
    // });

    // console.log(records)

    // const records = parse(fileContent, {columns: true});
    // console.log(records)
})();