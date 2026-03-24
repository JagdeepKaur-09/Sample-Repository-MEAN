const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  consentGiven: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);