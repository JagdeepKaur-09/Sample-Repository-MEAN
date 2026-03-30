const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const crypto = require("crypto");

// Create a room
router.post("/create", async (req, res) => {
  const { eventName, organizerId } = req.body;
  try {
    const roomCode = crypto.randomBytes(6).toString("hex");
    const room = new Room({ eventName, organizerId, roomCode });
    await room.save();
    res.json({ message: "Room created!", roomCode, roomLink: `http://localhost:5000/room/${roomCode}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get room by code
router.get("/:roomCode", async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;