const express = require("express");
// Express framework use kar rahe hain server banane ke liye

const path = require("path");
// File paths handle karne ke liye (HTML, static files etc.)

const cors = require("cors");
// Different frontend (Angular) ko backend access dene ke liye

const mongoose = require("mongoose");
// MongoDB connect karne ke liye

const http = require("http");
// HTTP server manually create karne ke liye (Socket.io ke liye needed)

const { Server } = require("socket.io");
// Real-time communication ke liye (live updates, rooms etc.)

require("dotenv").config();
// .env file se environment variables load karne ke liye


const app = express();
// Express app create kiya

const server = http.createServer(app);
// HTTP server banaya using express app (Socket.io ke liye)


/* ---------------- SOCKET.IO SETUP ---------------- */

const io = new Server(server, {
  cors: { origin: "http://localhost:4200" }
});
// Socket.io setup kiya aur Angular frontend ko allow kiya


/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({ origin: "http://localhost:4200" }));
// CORS enable kiya taaki Angular frontend request bhej sake

app.use(express.json());
// Incoming JSON data ko read karne ke liye middleware


// Socket.io ko routes me use karne ke liye store kar diya
app.set("socketio", io);


/* ---------------- STATIC FILES ---------------- */

// Bootstrap CSS serve karne ke liye
app.use("/css", express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")));

// Bootstrap JS serve karne ke liye
app.use("/js", express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")));


/* ---------------- DATABASE CONNECTION ---------------- */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  // Agar connection successful hua to message show karega

  .catch(err => console.error("MongoDB error:", err));
  // Agar error aaya to console me show karega


/* ---------------- BACKGROUND TASKS ---------------- */

// Image processing queue start ki (background me kaam karega)
require("./queues/imageQueue");

// Scheduled cleanup job (old face data delete karega)
require("./scripts/cleanup");


/* ---------------- ROUTES ---------------- */

// Authentication routes (login, signup)
app.use("/api/auth", require("./routes/auth"));

// Rooms related routes
app.use("/api/rooms", require("./routes/rooms"));

// Photos related routes
app.use("/api/photos", require("./routes/photos"));


/* ---------------- FRONTEND SERVE ---------------- */

// Root URL pe HTML file serve karega
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});


/* ---------------- SOCKET EVENTS ---------------- */

io.on("connection", (socket) => {
  // Jab koi user connect hota hai

  console.log("⚡ User connected:", socket.id);

  // User room join karega
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // Jab user disconnect kare
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


/* ---------------- SERVER START ---------------- */

const PORT = process.env.PORT || 5000;
// Port set kiya (env se ya default 5000)

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Server start hone ka message
});