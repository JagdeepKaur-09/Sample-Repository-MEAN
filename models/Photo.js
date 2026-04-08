const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  cloudinaryUrl: String,
  processedAt: Date,
  status: { type: String, enum: ["pending", "processed"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Photo", photoSchema);