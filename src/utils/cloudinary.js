import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import { getBase64 } from "../utils/helper.js";

// upload files to cloudinary
const uploadToCloudinary = async (files = []) => {
  try {
    const uploads = await Promise.all(
      files.map((file) =>
        cloudinary.uploader.upload(getBase64(file), {
          folder: "cabnex",
          resource_type: "auto",
          public_id: uuid(),
        })
      )
    );

    return uploads.map((f) => ({ url: f.secure_url, public_id: f.public_id }));
  } catch (error) {
    throw new Error(`Failed to upload files to Cloudinary: ${error.message}`);
  }
};

// delete files from cloudinary
const deleteFromCloudinary = async (files = []) => {
  try {
    const deletePromises = files.map((file) =>
      cloudinary.uploader.destroy(file.public_id)
    );

    const results = await Promise.all(deletePromises);

    return results;
  } catch (error) {
    throw new Error("Failed to delete files from Cloudinary");
  }
};

export { deleteFromCloudinary, uploadToCloudinary };
