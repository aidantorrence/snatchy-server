import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ankis = Router();
ankis.get("/ankis", async (req, res) => {
	try {
		const posts = await prisma.post.findMany();
		res.json(posts);
	} catch (e) {
		res.json(e);
	}
});

ankis.post("/ankis", async (req, res) => {
	try {
		const posts = await prisma.post.create({
			data: req.body,
		});
		res.status(200).send("post created");
	} catch (e) {
		res.status(400).send("post failed");
	}
});

ankis.get("/anki-to-review", async (req, res) => {
	try {
		const post = await prisma.$queryRaw`
			SELECT * FROM "Post"
            WHERE "reviewDate" = (SELECT min("reviewDate") FROM "Post")
			LIMIT 1
        `;
		res.json(post);
	} catch (e) {
		res.json(e);
	}
});

ankis.patch("/anki", async (req, res) => {
	const { id } = req.body;
	try {
		const post = await prisma.post.update({
			where: { id },
			data: req.body,
		});
		res.json(post);
	} catch (e) {
		res.json(e);
	}
});

export default ankis;
