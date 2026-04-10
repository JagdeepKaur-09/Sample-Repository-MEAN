const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Photo = require("../models/Photo");
const Room = require("../models/Room");

// Multer setup - stores file in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload photo route
const auth = require("../middleware/auth");

router.post("/upload", auth, upload.single("photo"), async (req, res) => {
  try {
    // Check if room exists
    const room = await Room.findById(req.body.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    // Check if logged in user is the organizer
    if (room.organizerId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Only the room organizer can upload photos" });
    }

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

// Get all photos in a room (anyone with room code can view)
router.get("/:roomId", auth, async (req, res) => {
  try {
    const photos = await Photo.find({ roomId: req.params.roomId });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;