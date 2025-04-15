import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../src/config/cloudinary";

// Allowed file types (you can add more as needed)
const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Validate file type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("Unsupported file type");
    }

    // Extract file format from mimetype
    const format = file.mimetype.split("/")[1];

    // Generate a unique public ID using the filename and timestamp
    const publicId = `${file.originalname.split(".")[0]}_${Date.now()}`;

    return {
      folder: "posts",
      format,
      public_id: publicId, // Ensure unique public ID
      upload_preset: 'my_unsigned_uploads'
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max file size of 10MB (adjust as needed)
  },
}).single("file"); // You can adjust this if you're uploading multiple files

export default upload;
