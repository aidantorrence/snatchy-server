import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const outfits = Router();
outfits.get("/outfits", async (req, res) => {
  const uid = req.query.uid as string;
  try {
    const outfits = await prisma.outfit.findMany({
      include: {
        owner: true,
      },
    });
    res.json(outfits);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

outfits.get("/outfits-with-votes", async (req, res) => {
  const uid = req.query.uid as string;
  try {
    // custom sql query, get outfits with the vote count using the postVote table, get user data from the user table
    // const outfits = await prisma.$queryRaw`SELECT o.*, sum(pv.vote) AS voteCount FROM "Outfit" o LEFT JOIN "PostVote" pv ON o.id = pv."outfitId" GROUP BY o.id`;
    const outfits = await prisma.$queryRaw`SELECT o.*, sum(pv.vote)::int AS votes, u.* FROM "Outfit" o LEFT JOIN "PostVote" pv ON o.id = pv."outfitId" LEFT JOIN "User" u ON o."ownerId" = u.uid GROUP BY o.id, u.uid`;
    console.log(outfits);

    res.json(outfits);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

outfits.get("/outfit/:id", async (req, res) => {
  const { id } = req.params;
  const uid = req.query.uid as string;
  try {
    const outfit = await prisma.outfit.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      include: {
        owner: true,
        Comment: {
          include: {
            owner: true,
          }
        },
        postVote: {
          where: {
            uid,
          }
        }
      },
    });

    const votesPerPost = await prisma.postVote.aggregate({
      where: {
        outfitId: parseInt(id, 10),
      },
      _sum: {
        vote: true,
      },
    });

    res.json({ ...outfit, votes: (outfit?.upvotes || 0) - (outfit?.downvotes || 0) + (votesPerPost?._sum?.vote || 0) });

  } catch (e) {
    res.json(e);
  }
});

outfits.post("/outfit", async (req, res) => {
  try {
    const outfit = await prisma.outfit.create({
      data: req.body,
    });
    res.status(200).send(outfit);
  } catch (e) {
    console.log(e);
    res.status(400).send("outfit failed");
  }
});

outfits.patch("/outfit", async (req, res) => {
  const { id } = req.body;
  try {
    const outfit = await prisma.outfit.update({
      where: {
        id: parseInt(id, 10),
      },
      data: req.body,
    });
    res.status(200).send(outfit);
  } catch (e) {
    console.log(e);
    res.status(400).send("outfit failed");
  }
});

outfits.delete("/outfit", async (req, res) => {
  const { id } = req.body;
  try {
    const outfit = await prisma.outfit.delete({
      where: {
        id: parseInt(id, 10),
      },
    });
    res.status(200).send(outfit);
  } catch (e) {
    console.log(e);
    res.status(400).send("outfit failed");
  }
});

outfits.patch("/outfit", async (req, res) => {
  const { id } = req.body;
  try {
    const outfit = await prisma.outfit.update({
      where: { id },
      data: req.body,
    });
    res.json(outfit);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

outfits.delete("/outfit", async (req, res) => {
  const { id } = req.body;
  try {
    const outfit = await prisma.outfit.delete({
      where: { id },
    });
    res.json(outfit);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

outfits.post("/flagged-content", async (req, res) => {
  try {
    const outfit = await prisma.flaggedContent.create({
      data: req.body,
    });
    res.json(outfit);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

export default outfits;
