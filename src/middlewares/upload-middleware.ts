import multer from "multer";
import { BadRequestError } from "../errors/BadRequestError";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/jpg",
    ];
    const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;

    const isMimeValid = allowedMimeTypes.includes(file.mimetype);
    const isExtValid = allowedExtensions.test(file.originalname);

    if (isMimeValid || isExtValid) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Only JPG, JPEG, PNG, and GIF files are allowed"));
    }
  },
});
