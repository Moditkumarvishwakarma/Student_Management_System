const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const studentRoutes = require("./src/routes/studentRoutes");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Student Management API is running." });
});

app.use("/api/students", studentRoutes);

// Keep unexpected API errors in one place so the frontend gets a useful message.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong on the server."
  });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Add it to server/.env.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  app.listen(port, () => {
    console.log(`Student API listening at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(`Could not start the server: ${error.message}`);
  process.exit(1);
});
