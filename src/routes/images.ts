import Router from "express-promise-router";
import axios from 'axios';
import FormData from 'form-data';
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

images.post("/upload-image-seasonal-color-analysis", async (req: any, res) => {
  try {
    const { imageUrl } = req.body;
    const formData = new FormData();
    const file = new File([imageUrl], 'image.png', { type: 'image/png' });
    formData.append('image', file);
    const { data } = await axios.post('54.193.65.224/classify', formData);
    res.json(data);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

export default images;
