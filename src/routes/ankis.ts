import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

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

ankis.get("/ankis-completed-today", async (req, res) => {
	const startOfDay = DateTime.now().startOf("day").toUTC().toISO();
	try {
		const post = await prisma.$queryRaw`
			SELECT COUNT(id) FROM "Post"
            WHERE DATE("lastReviewedDate" at time zone 'utc' at time zone 'est') = DATE(NOW() at time zone 'utc' at time zone 'est')
			AND DATE("reviewDate" at time zone 'utc' at time zone 'est') <> DATE(NOW() at time zone 'utc' at time zone 'est')
        `;
		res.json(post);
	} catch (e) {
		res.json(e);
	}
});

ankis.post("/anki", async (req, res) => {
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
            WHERE "reviewDate" = (
				SELECT min("reviewDate") 
				FROM "Post"
				WHERE ( "lastReviewedDate" IS NULL OR DATE("lastReviewedDate" at time zone 'utc' at time zone 'est') <> DATE(NOW() at time zone 'utc' at time zone 'est') )
			)
			LIMIT 1
        `;
		// WHERE ("updatedAt" < NOW() - INTERVAL '6 hours' OR EXTRACT (epoch from ("updatedAt" - "createdAt")) < 60)
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

ankis.delete("/anki", async (req, res) => {
	const { id } = req.body;
	try {
		const post = await prisma.post.delete({
			where: { id },
		});
		res.json(post);
	} catch (e) {
		res.json(e);
	}
});

export default ankis;
