import Router from "express-promise-router";
import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const images = Router();

images.post("upload-images", async (req, res) => {
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
