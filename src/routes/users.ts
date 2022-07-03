import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = Router();

users.get("/user/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(req.params.id, 10),
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
  const { id } = req.body;
  try {
    const listing = await prisma.user.update({
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

export default users;
