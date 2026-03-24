const Room = require("../models/Room");
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Create a room
router.post("/create", async (req, res) => {
  const { eventName, organizerId } = req.body;
  try {
    const roomCode = crypto.randomBytes(6).toString("hex"); // generates random room code
    const room = new Room({ eventName, organizerId, roomCode });
    await room.save();
    res.json({ message: "Room created!", roomCode, roomLink: `http://localhost:5000/room/${roomCode}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;