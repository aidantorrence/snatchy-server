import { Router } from "express";
import comments from "./comments";
import stableDiffusion from "./replicate";
import images from "./images";
import outfits from "./outfits";
import users from "./users";
import votes from "./votes";

const router = Router();

router.use(outfits);
router.use(users);
router.use(comments);
// router.use(s);
// router.use(sendGrid);
router.use(images);
router.use(votes);
router.use(stableDiffusion)


export default router;
