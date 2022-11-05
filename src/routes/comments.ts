import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const comments = Router();
comments.post("/comment", async (req, res) => {
  try {
    const comment = await prisma.comment.create({
      data: req.body,
    });
    res.status(200).send(comment);
  } catch (e) {
    console.log(e);
    res.status(400).send("comment failed");
  }
});

export default comments