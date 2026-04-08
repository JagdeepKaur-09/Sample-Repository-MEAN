const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Photo = require("../models/Photo");

// Multer setup - stores file in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload photo route
const auth = require("../middleware/auth");

router.post("/upload", auth, upload.single("photo"), async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "eventsnap" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const photo = new Photo({
      roomId: req.body.roomId,
      cloudinaryUrl: result.secure_url,
      processedAt: new Date()
    });
    await photo.save();

    res.json({ message: "Photo uploaded!", url: result.secure_url, photo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;