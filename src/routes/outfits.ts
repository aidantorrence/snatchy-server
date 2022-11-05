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

outfits.get("/outfit/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const outfit = await prisma.outfit.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      include: {
        owner: true,
        Comment: true,
      },
    });
    res.json(outfit);
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
