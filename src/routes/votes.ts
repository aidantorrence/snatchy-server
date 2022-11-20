import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const votes = Router();

votes.post("/post-vote", async (req, res) => {
  const { uid, outfitId, vote } = req.body;
  try {
    const postVote = await prisma.postVote.upsert({
      where: { uid_outfitId: { uid, outfitId } },
      update: { uid, outfitId, vote },
      create: { uid, outfitId, vote },
    });
    res.status(200).send(postVote);
  } catch (e) {
    console.log(e);
    res.status(400).send("post vote create or update failed");
  }
});

export default votes;
