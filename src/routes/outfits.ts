import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
import sgMail from "@sendgrid/mail";

const prisma = new PrismaClient();

const outfits = Router();
outfits.get("/outfits", async (req, res) => {
  const uid = req.query.uid as string;
  try {
    const outfits = await prisma.outfit.findMany({
      include: {
        owner: true,
        postVote: {
          where: {
            uid,
          },
        },
        _count: {
          select: {
            Comment: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          upvotes: "desc",
        },
      ],
    });
    const outfitVotes =
      await prisma.$queryRaw`SELECT o.id, coalesce(sum(pv.vote), 0)::int AS votes FROM "Outfit" o right JOIN "PostVote" pv ON o.id = pv."outfitId" LEFT JOIN "User" u ON o."ownerId" = u.uid GROUP BY o.id, u.uid` as any;
    const outfitsWithVotes = outfits.map((outfit) => {
      const outfitVote = outfitVotes.find(
        (outfitVote: any) => outfitVote.id === outfit.id
      );
      return {
        ...outfit,
        votes: outfitVote?.votes || 0,
      };
    });
    res.json(outfitsWithVotes);
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
    const outfits =
      await prisma.$queryRaw`SELECT o.id, coalesce(sum(pv.vote), 0)::int AS votes FROM "Outfit" o right JOIN "PostVote" pv ON o.id = pv."outfitId" LEFT JOIN "User" u ON o."ownerId" = u.uid GROUP BY o.id, u.uid`;
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
          },
        },
        postVote: {
          where: {
            uid,
          },
        },
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

    res.json({
      ...outfit,
      votes:
        (outfit?.upvotes || 0) -
        (outfit?.downvotes || 0) +
        (votesPerPost?._sum?.vote || 0),
    });
  } catch (e) {
    res.json(e);
  }
});

outfits.post("/outfit", async (req, res) => {
  const { ownerId, kibbeTypes } = req.body;
  const modusTypes = {
    D: "Queen",
    DC: "Boss",
    FG: "Coquette",
    FN: "Supermodel",
    R: "Siren",
    SC: "Lady",
    SD: "Feline",
    SG: "Ingenue",
    SN: "Vixen",
    TR: "Femme Fatale",
  } as any;

  try {
    const user = await prisma.user.findUnique({
      where: {
        uid: ownerId,
      },
    });

    const outfitModusTypes = (!kibbeTypes || !kibbeTypes.length) && user?.modusType
            ? [modusTypes[user?.modusType || ""]]
            : kibbeTypes

    const outfit = await prisma.outfit.create({
      data: {
        ...req.body,
        kibbeTypes: outfitModusTypes
      },
    });
    res.status(200).send(outfit);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: 'jenniferxiao@college.harvard.edu',
        from: "aidan.torrence@gmail.com", // Change to your verified sender
        dynamicTemplateData: {
          description: req.body.description,
          content: req.body.content,
          seasonalColors: req.body.seasonalColors.join(", "),
          modusTypes: outfitModusTypes.join(", "),
          postReason: req.body.postReason,
          imageUrl: req.body.images[0],
          userName: user?.firstName + " " + user?.lastName,
        },
        templateId: "d-20efd7aaa1774f708c692069875a5124",
      },
    ];
    await sgMail.send(messages);
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
