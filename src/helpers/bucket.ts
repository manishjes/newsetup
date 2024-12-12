import { Storage } from "@google-cloud/storage";
import User from "@/models/user";
import { getFileName } from "./helper";

const storage = new Storage({
  projectId: "development-412107",
  keyFilename:
    "/Users/shreecomputer/Documents/Project/Peak72/backend/src/config/keys/bucketKeys.json",
});

const bucket = storage.bucket("poonam_coatings");

const uploadImage = async () => {
  const data: any = await User.find(
    {
      "photo.localUrl": { $ne: null },
    },
    { photo: 1 }
  );

  for (let i = 0; i < data.length; i++) {
    // console.log(data[i].photo.localUrl);
    const file = await getFileName(data[i].photo.localUrl);

    bucket.upload(
      `public/photos/${file}`,
      {
        destination: `photos/${file}`,
      },
      async (err, file: any) => {
        if (err) {
          console.log(err);
        } else {
          console.log(file.publicUrl());
        }
      }
    );
  }

  // console.log(data);
};

export default uploadImage;


