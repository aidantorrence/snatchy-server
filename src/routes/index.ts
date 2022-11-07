import { Router } from "express";
import comments from "./comments";
import images from "./images";
import outfits from "./outfits";
import users from "./users";

const router = Router();

router.use(outfits);
router.use(users);
router.use(comments);
// router.use(s);
// router.use(sendGrid);
router.use(images);

export default router;
