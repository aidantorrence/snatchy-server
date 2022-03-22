import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

const tasks = Router();
tasks.get("/tasks-completed-today", async (req, res) => {
	const startOfDay = DateTime.now().startOf("day").toUTC().toISO();
	try {
		const tasks = await prisma.task.findMany({
			where: {
				createdAt: {
					gt: startOfDay,
				},
			},
		});
		// const records = await prisma.task.aggregate({
		// 	_count: {
		// 		content: true,
		// 	},
		// 	where: {
		// 		createdAt: {
		// 			gt: startOfDay,
		// 		},
		// 	},
		// });
		res.json(tasks);
	} catch (e) {
		res.json(e);
	}
});
tasks.get("/backlog", async (req, res) => {
	try {
		const tasks = await prisma.task.findMany({
			where: {
				completed: false,
			},
		});
		res.json(tasks);
	} catch (e) {
		res.json(e);
	}
});

tasks.post("/tasks", async (req, res) => {
	try {
		const tasks = await prisma.task.create({
			data: req.body,
		});
		res.status(200).send("task created");
	} catch (e) {
		res.status(400).send("task failed");
	}
});
tasks.patch("/tasks", async (req, res) => {
	try {
		const tasks = await prisma.task.update({
			where: {
				id: req.body.id,
			},
			data: req.body,
		});
		res.status(200).send("task updated");
	} catch (e) {
		res.status(400).send("task failed");
	}
});
tasks.delete("/tasks", async (req, res) => {
	try {
		const tasks = await prisma.task.delete({
			where: {
				id: req.body.id,
			},
		});
		res.status(200).send("task deleted");
	} catch (e) {
		res.status(400).send("task failed");
	}
});

export default tasks;
