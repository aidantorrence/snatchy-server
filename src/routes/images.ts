import Router from "express-promise-router";
import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";

const images = Router();

const firebaseConfig = { 
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

!getApps().length ? initializeApp(firebaseConfig) : getApp();

images.post("/upload-images", async (req, res) => {
  const blob = req.body;
  try {
    const fileRef = ref(getStorage(), uuidv4());
    await uploadBytesResumable(fileRef, blob);

    const downloadUrl = await getDownloadURL(fileRef);
    res.json(downloadUrl);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});

export default images;
