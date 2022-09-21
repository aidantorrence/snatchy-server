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
        listings: {
          where: {
            sold: false,
          },
        },
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
    const data = await prisma.user.update({
      where: {
        uid,
      },
      data: req.body,
    });
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send("user update failed");
  }
});

users.post("/user", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.create({
      data: {
        ...req.body,
        email: email.toLowerCase(),
      },
    });
    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(400).send("user failed");
  }
});

users.delete("/user", async (req, res) => {
  const uid = req.body;
  try {
    const data = await prisma.user.delete({
      where: {
        uid,
      },
    });
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send("user delete failed");
  }
});

export default users;
