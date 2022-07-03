import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = Router();

users.get("/user/:uid", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        uid: req.params.uid,
      },
      include: {
        listings: true,
      },
    });
    res.json(user);
  } catch (e) {
    res.json(e);
  }
});

users.patch("/user", async (req, res) => {
  const { uid } = req.body;
  try {
    const listing = await prisma.user.update({
      where: {
        uid,
      },
      data: req.body,
    });
    res.status(200).send(listing);
  } catch (e) {
    console.log(e);
    res.status(400).send("listing failed");
  }
});

users.post("/user", async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: req.body,
    });
    res.status(200).send(user);
  } catch (e) {
		console.log(e)
    res.status(400).send("user failed");
  }
});

export default users;
