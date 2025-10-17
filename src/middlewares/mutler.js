import multer from "multer";

export const upload = multer({
  filesize: 1024 * 1024 * 5,
});
