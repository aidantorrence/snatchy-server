import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

const listings = Router();
listings.get("/listings", async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        owner: true, // Return all fields
      },
    });
    res.json(listings);
  } catch (e) {
		console.log(e)
    res.json(e);
  }
});

listings.get("/listing/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await prisma.listing.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      include: {
        owner: true,
      },
    });
    res.json(listing);
  } catch (e) {
		console.log(e)
    res.json(e);
  }
});

listings.get("/listings-completed-today", async (req, res) => {
  const startOfDay = DateTime.now().startOf("day").toUTC().toISO();
  try {
    const listing = await prisma.$queryRaw`
			SELECT COUNT(id) FROM "listing"
            WHERE DATE("lastReviewedDate" at time zone 'utc' at time zone 'est') = DATE(NOW() at time zone 'utc' at time zone 'est')
			AND DATE("reviewDate" at time zone 'utc' at time zone 'est') <> DATE(NOW() at time zone 'utc' at time zone 'est')
        `;
    res.json(listing);
  } catch (e) {
		console.log(e)
    res.json(e);
  }
});

listings.post("/listing", async (req, res) => {
  try {
    const listing = await prisma.listing.create({
      data: req.body,
    });
    res.status(200).send(listing);
  } catch (e) {
		console.log(e)
    res.status(400).send("listing failed");
  }
});

listings.patch("/listing", async (req, res) => {
  const { id } = req.body;
  try {
    const listing = await prisma.listing.update({
      where: {
        id: parseInt(id, 10),
      },
      data: req.body,
    });
    res.status(200).send(listing);
  } catch (e) {
		console.log(e)
    res.status(400).send("listing failed");
  }
});

listings.delete("/listing", async (req, res) => {
  const { id } = req.body;
  try {
    const listing = await prisma.listing.delete({
      where: {
        id: parseInt(id, 10),
      },
    });
    res.status(200).send(listing);
  } catch (e) {
		console.log(e)
    res.status(400).send("listing failed");
  }
});

listings.get("/listing-to-review", async (req, res) => {
  try {
    const listing = await prisma.$queryRaw`
			SELECT * FROM "listing"
            WHERE "reviewDate" = (
				SELECT min("reviewDate") 
				FROM "listing"
				WHERE ( "lastReviewedDate" IS NULL OR DATE("lastReviewedDate" at time zone 'utc' at time zone 'est') <> DATE(NOW() at time zone 'utc' at time zone 'est') )
				AND ENABLED = true
			)
			LIMIT 1
        `;
    // WHERE ("updatedAt" < NOW() - INTERVAL '6 hours' OR EXTRACT (epoch from ("updatedAt" - "createdAt")) < 60)
    res.json(listing);
  } catch (e) {
		console.log(e)
    res.json(e);
  }
});

listings.patch("/listing", async (req, res) => {
  const { id } = req.body;
  try {
    const listing = await prisma.listing.update({
      where: { id },
      data: req.body,
    });
    res.json(listing);
  } catch (e) {
		console.log(e)
    res.json(e);
  }
});
// listings.patch("/filter-listings", async (req, res) => {
// 	const ids = req.body;
// 	try {
// 		const listing = await prisma.$queryRaw`
// 			update "listing"
// 			set "enabled" =
// 			CASE when topic in (${Prisma.join(ids)}) THEN TRUE
// 			ELSE FALSE END
// 		`;
// 		res.json(listing);
// 	} catch (e) {
// 		res.json(e);
// 	}
// });

listings.delete("/listing", async (req, res) => {
  const { id } = req.body;
  try {
    const listing = await prisma.listing.delete({
      where: { id },
    });
    res.json(listing);
  } catch (e) {
		console.log(e)
    res.json(e);
  }
});

export default listings;
