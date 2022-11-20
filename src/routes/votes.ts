import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const votes = Router();

votes.post("/vote", async (req, res) => {
  const { uid, blockedUid } = req.body;
  try {
    const data = await prisma.vote.create({
      data: {
        blockerId: uid,
        blockedId: blockedUid,
      },
    });
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send("block update failed");
  }
});

export default votes;