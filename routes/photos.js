const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Photo = require("../models/Photo");
const Room = require("../models/Room");
const User = require('../models/User');
const auth = require('../middleware/auth');
const canvas = require("canvas");
const faceapi = require("face-api.js");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
const imageQueue = require('../queues/imageQueue');

// Add a helper to load models once
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromDisk("./models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
}
loadModels();
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

    // 1. Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: "eventsnap" }, (error, result) => {
        if (error) reject(error); else resolve(result);
      }).end(req.file.buffer);
    });

    // 2. NEW: Detect faces in the uploaded buffer
    const img = await canvas.loadImage(req.file.buffer);
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    // 3. Save descriptors as arrays of numbers
    const faceDescriptors = detections.map(d => Array.from(d.descriptor));

    const photo = new Photo({
      roomId: req.body.roomId,
      cloudinaryUrl: result.secure_url,
      faceDescriptors: faceDescriptors, // SAVE THE FACE DATA HERE
      processedAt: new Date()
    });
    
    await photo.save();
    res.json({ message: "Photo uploaded and scanned!", url: result.secure_url });
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

const PDFDocument = require('pdfkit');
const axios = require('axios');

// GET /api/photos/download-pdf
router.get('/download-pdf', auth, async (req, res) => {
  try {
    const { images } = req.query; // Expecting a comma-separated string of URLs
    if (!images) return res.status(400).json({ error: "No images provided" });

    const imageUrls = images.split(',');
    const doc = new PDFDocument({ margin: 30 });

    // Set headers to trigger a file download in the browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=MyEventPhotos.pdf');

    doc.pipe(res);
    doc.fontSize(25).text('EventSnap AI - Your Gallery', { align: 'center' });
    doc.moveDown();

    for (const url of imageUrls) {
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');
        doc.addPage().image(buffer, { fit: [500, 600], align: 'center', valign: 'center' });
      } catch (err) {
        console.error("Image fetch failed for URL:", url);
      }
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "PDF Error: " + err.message });
  }
});

router.get('/match/:roomId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.faceDescriptor || user.faceDescriptor.length === 0) {
      return res.status(400).json({ message: "Register your face first!" });
    }

    const photos = await Photo.find({ roomId: req.params.roomId });
    const userFace = new Float32Array(user.faceDescriptor);
    
    const highConfidence = [];
    const lowConfidence = [];

    photos.forEach(photo => {
      let bestDistance = 1.0; // Start with max distance

      photo.faceDescriptors.forEach(faceData => {
        const photoFace = new Float32Array(faceData);
        // Calculate Euclidean Distance
        const distance = Math.sqrt(
          userFace.reduce((acc, val, i) => acc + Math.pow(val - photoFace[i], 2), 0)
        );
        if (distance < bestDistance) bestDistance = distance;
      });

      if (bestDistance < 0.45) {
        highConfidence.push(photo);
      } else if (bestDistance < 0.6) {
        lowConfidence.push(photo);
      }
    });

    res.json({ matches: highConfidence, maybe: lowConfidence });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/upload", auth, upload.single("photo"), async (req, res) => {
  try {
    // 1. Upload to Cloudinary first
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: "eventsnap" }, (error, result) => {
        if (error) reject(error); else resolve(result);
      }).end(req.file.buffer);
    });

    // 2. Save the photo record (initially with no face data)
    const photo = new Photo({
      roomId: req.body.roomId,
      cloudinaryUrl: result.secure_url,
      status: 'processing' // New status field
    });
    await photo.save();

    // 3. Push the AI task to the background queue!
    await imageQueue.add({
      photoId: photo._id,
      imageUrl: result.secure_url
    });

    // 4. Respond to user immediately
    res.json({ message: "Upload started! AI is scanning in the background.", photo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;