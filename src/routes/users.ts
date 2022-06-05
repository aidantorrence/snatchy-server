import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = Router();

users.get('/user/:id', async (req , res) => {
	try {
		const user = await prisma.user.findUnique({
      where: {
        id: parseInt(req.params.id, 10),
      },
      include: {
        listings: true,
      },
    })
    res.json(user);
	} catch (e) {
		res.json(e);
	}
});

export default users