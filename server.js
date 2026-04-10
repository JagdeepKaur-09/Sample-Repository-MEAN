const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http"); // Required for Socket.io
const { Server } = require("socket.io"); // Required for Socket.io
require("dotenv").config();

const app = express();

// 1. Create HTTP server from Express app
const server = http.createServer(app);

// 2. Initialize Socket.io
const io = new Server(server, {
  cors: { origin: "http://localhost:4200" }
});

const cors = require("cors");
app.use(cors({ origin: "http://localhost:4200" }));

// Lets server read JSON data
app.use(express.json());

// 3. Attach io to the app instance so routes can access it
app.set("socketio", io);

// 4. Start the Background Processing Queue (Bull)
require("./queues/imageQueue");

// Serve static Bootstrap files
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ Error:", err));

// Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

// Socket.io Connection Logic
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // Allow participants to join a specific room for real-time updates
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`👤 User joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔥 User disconnected");
  });
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const roomRoutes = require("./routes/rooms");
app.use("/api/rooms", roomRoutes);

const photoRoutes = require("./routes/photos");
app.use("/api/photos", photoRoutes);

// 5. Change app.listen to server.listen to support WebSockets
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.io running on http://localhost:${PORT}`);
});