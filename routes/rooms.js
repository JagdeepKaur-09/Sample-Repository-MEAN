const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const crypto = require("crypto");
const auth = require("../middleware/auth");

// Create a room
router.post("/create", auth, async (req, res) => {
  const { eventName } = req.body;
  try {
    const roomCode = crypto.randomBytes(6).toString("hex");
    const room = new Room({ 
      eventName, 
      organizerId: req.user.userId,  // ← get from token, not body
      roomCode 
    });
    await room.save();
    res.json({ message: "Room created!", roomCode, roomLink: `http://localhost:5000/room/${roomCode}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all rooms by organizer
router.get("/my-rooms", auth, async (req, res) => {
  try {
    const rooms = await Room.find({ organizerId: req.user.userId });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
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