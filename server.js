const express = require("express");
const path = require("path");

const app = express();

// Serve static Bootstrap files (npm method)
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

// Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

// Server start
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
