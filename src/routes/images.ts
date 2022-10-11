import Router from "express-promise-router";
import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { firebaseConfig } from "../config";

const images = Router();

!getApps().length ? initializeApp(firebaseConfig) : getApp();

images.post("/upload-images", async (req: any, res) => {
  const file = req?.files?.file;
  try {
    const fileRef = ref(getStorage(), uuidv4());
    await uploadBytesResumable(fileRef, file.data);
    const downloadUrl = await getDownloadURL(fileRef);
    res.json(downloadUrl);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

export default images;
