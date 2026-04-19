const express = require("express"); 
// Import Express framework

const router = express.Router(); 
// Create router object to define routes

const bcrypt = require("bcryptjs"); 
// Import bcrypt for password hashing and comparison

const jwt = require("jsonwebtoken"); 
// Import JSON Web Token for authentication

const User = require("../models/User"); 
// Import User model to interact with database

const auth = require("../middleware/auth"); 
// Import authentication middleware for protected routes


// ---------------------- SIGNUP ROUTE ----------------------

// POST /api/auth/signup
router.post("/signup", async (req, res) => {

  const { name, email, password } = req.body; 
  // Extract user input from request body

  try {
    // Check if all fields are provided
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    // Check if user already exists with same email
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already registered." });

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const user = new User({ name, email, password: hashedPassword });

    // Save user in database
    await user.save();

    // Send success response
    res.json({ message: "User created successfully!" });

  } catch (err) {
    // Handle errors
    res.status(400).json({ error: err.message });
  }
});


// ---------------------- LOGIN ROUTE ----------------------

// POST /api/auth/login
router.post("/login", async (req, res) => {

  const { email, password } = req.body; 
  // Get login credentials from user

  try {
    // Validate input fields
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) 
      return res.status(400).json({ error: "User not found." });

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) 
      return res.status(400).json({ error: "Wrong password." });

    // Generate JWT token for authentication
    const token = jwt.sign(
      { userId: user._id },              // Payload
      process.env.JWT_SECRET,            // Secret key
      { expiresIn: "7d" }                // Token validity
    );

    // Send success response with token
    res.json({ message: "Login successful!", token });

  } catch (err) {
    // Handle server errors
    res.status(500).json({ error: err.message });
  }
});


// ---------------------- FACE REGISTRATION ROUTE ----------------------

// POST /api/auth/register-face
router.post("/register-face", auth, async (req, res) => {

  try {
    // Extract face descriptor array from request
    const { faceDescriptor } = req.body;

    // Validate face data (must contain 128 values)
    if (!faceDescriptor || faceDescriptor.length !== 128)
      return res.status(400).json({ error: "Invalid face data. Expected 128 values." });

    // Update user's face data in database
    await User.findByIdAndUpdate(req.user.userId, { faceDescriptor });

    // Send success message
    res.json({ message: "Face registered successfully!" });

  } catch (err) {
    // Handle errors
    res.status(500).json({ error: err.message });
  }
});


// Export router to use in main server file
module.exports = router;