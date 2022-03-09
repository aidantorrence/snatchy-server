import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tasks = Router();
tasks.get("/tasks", async (req, res) => {
	try {
		const tasks = await prisma.task.findMany();
		res.json(tasks);
	} catch (e) {
		res.json(e);
	}
});

tasks.post("/tasks", async (req, res) => {
	try {
		const posts = await prisma.task.create({
			data: req.body,
		});
		res.status(200).send("task created");
	} catch (e) {
		res.status(400).send("task failed");
	}
});


export default tasks;
