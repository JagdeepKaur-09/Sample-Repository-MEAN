const Queue = require('bull');
const Photo = require('../models/Photo');
const canvas = require('canvas');
const faceapi = require('face-api.js');

// Connect to Redis
const imageQueue = new Queue('image-processing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// The worker: This code runs in the background
imageQueue.process(async (job) => {
  const { photoId, imageUrl } = job.data;
  
  try {
    // 1. Load the image from the URL
    const img = await canvas.loadImage(imageUrl);
    // Inside the imageQueue.process function, after await photo.save()
const io = job.app.get("socketio"); // We'll pass the app instance to the worker
io.to(roomId).emit("photoProcessed", {
  photoId: photoId,
  status: 'processed',
  url: imageUrl
});
    // 2. Run AI detection
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const faceDescriptors = detections.map(d => Array.from(d.descriptor));

    // 3. Update the database record created during upload
    await Photo.findByIdAndUpdate(photoId, { 
      faceDescriptors: faceDescriptors,
      status: 'processed' 
    });

    return { status: 'completed', facesFound: faceDescriptors.length };
  } catch (err) {
    console.error("Queue Error:", err);
    throw err;
  }
});

module.exports = imageQueue;