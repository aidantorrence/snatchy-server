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

ankis.get("/least-recently-viewed-anki", async (req, res) => {
	try {
		const post = await prisma.$queryRaw`
			SELECT * FROM "Post"
            WHERE "updatedAt" = (SELECT min("updatedAt") FROM "Post")
        `;
		res.json(post);
	} catch (e) {
		res.json(e);
	}
});
ankis.patch("/least-recently-viewed-anki", async (req, res) => {
	try {
		const post = await prisma.$queryRaw`
            UPDATE "Post"
            SET "updatedAt" = now()
            WHERE "updatedAt" = (SELECT min("updatedAt") FROM "Post")
            RETURNING *
        `;
		res.json(post);
	} catch (e) {
		res.json(e);
	}
});

export default ankis;
