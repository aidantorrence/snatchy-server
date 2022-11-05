import { Router } from "express";
import comments from "./comments";
import images from "./images";
import offers from "./offers";
import outfits from "./outfits";
import sendGrid from "./sendgrid";
import s from "./stripe";
import trades from "./trades";
import users from "./users";

const router = Router();

router.use(outfits);
router.use(users);
router.use(comments);
// router.use(s);
// router.use(sendGrid);
// router.use(images);

export default router;
