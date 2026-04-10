const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");  // ← is this line there?

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);  // ← is this line there?
    const user = new User({ name, email, password: hashedPassword });  // ← hashedPassword here, not password
    await user.save();
    res.json({ message: "User created successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const jwt = require("jsonwebtoken");

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Wrong password" });

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful!", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const auth = require("../middleware/auth");
const User = require("../models/User");

// Add this route to update face data
router.post("/register-face", auth, async (req, res) => {
  try {
    const { descriptor } = req.body;
    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({ error: "Invalid face data" });
    }

    await User.findByIdAndUpdate(req.user.userId, { faceDescriptor: descriptor });
    res.json({ message: "Face registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;