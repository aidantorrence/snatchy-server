import { Router } from "express";
import listings from "./listings";
import offers from "./offers";
import sendGrid from "./sendgrid";
import s from "./stripe";
import trades from "./trades";
import users from "./users";

const router = Router();

router.use(listings);
router.use(users);
router.use(s);
router.use(sendGrid);
router.use(offers);
router.use(trades);

export default router;
