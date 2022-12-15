import Router from "express-promise-router";
import axios from "axios";
const fs = require("fs");
const FormData = require("form-data");
import { Readable } from "stream";
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
    const uuid = uuidv4();
    const fileRef = ref(getStorage(), uuid);
    await uploadString(fileRef, req.body.file, "data_url");
    res.json(uuid);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

images.post("/upload-image-seasonal-color-analysis", async (req: any, res) => {
  try {
    const { uid, imageUrl } = req.body;
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    // const buffer = Buffer.from(response.data);

    fs.writeFileSync(`src/scripts/seasonal_color_analysis_${uid}.jpg`, response.data);
    // const formData = new FormData();
    // // const file = new fs.File([imageUrl], 'image.png', { type: 'image/png' });
    // // console.log(file);

    // formData.append('image', buffer);
    // const { data } = await axios.post('54.193.65.224/classify', formData);
    // res.json(data);

    // const headers = {
    //   "Content-Type":'multipart/form-data'
    // }
// ; boundary=${form._boundary}
    const formData = new FormData();

    // formData.append('image', Readable.from(buffer));

    formData.append('image', fs.createReadStream(`src/scripts/seasonal_color_analysis_${uid}.jpg`));
    const { data } = await axios.post('http://54.193.65.224/classify', formData, { headers: formData.getHeaders() });
    fs.unlinkSync(`src/scripts/seasonal_color_analysis_${uid}.jpg`);
    res.json(data);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

export default images;
