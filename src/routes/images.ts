import Router from "express-promise-router";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  uploadString,
} from "firebase/storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { firebaseConfig } from "../config";

const images = Router();

!getApps().length ? initializeApp(firebaseConfig) : getApp();

images.post("/upload-images", async (req: any, res) => {
  try {
    const uuid = uuidv4()
    const fileRef = ref(getStorage(), uuid);
    await uploadString(fileRef, req.body.file, 'data_url');
    res.json(uuid);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

export default images;
