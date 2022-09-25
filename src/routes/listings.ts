import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

const listings = Router();
listings.get("/listings", async (req, res) => {
  const uid = req.query.uid as string;
  try {
    const listings = await prisma.listing.findMany({
      where: {
        sold: false,
        owner: {
          uid: {
            not: uid,
          },
          Blocker: {
            none: {
              blockedId: uid,
            },
          },
          Blocked: {
            none: {
              blockerId: uid,
            },
          },
        },
      },
      include: {
        owner: true,
      },
    });
    res.json(listings);
  } catch (e) {
    console.log(e);
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
    console.log(listing);
    res.json(listing);
  } catch (e) {
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
    console.log(e);
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
    console.log(e);
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
    console.log(e);
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
    console.log(e);
    res.status(400).send("listing failed");
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
    console.log(e);
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
    console.log(e);
    res.json(e);
  }
});

listings.post("/flagged-content", async (req, res) => {
  try {
    const listing = await prisma.flaggedContent.create({
      data: req.body,
    });
    res.json(listing);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

export default listings;
