// Entry point: run with "npm start" (or "npm run dev")
require("dotenv").config(); // loads .env into process.env

const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();
app.set("trust proxy", 1); // Render sits behind a proxy; needed for correct https URLs

// ---------- global middleware ----------

// CORS: which websites may call this API.
// With CLIENT_URL set (production) only those sites are allowed; otherwise everything is (development).
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      cb(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded product images are served from /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- routes ----------
app.get("/", (req, res) => res.json({ message: "Meridian API is running", docs: "/api" }));
app.get("/api", (req, res) => res.json({ message: "Meridian API", status: "ok" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));

// ---------- errors (must be last) ----------
app.use(notFound);
app.use(errorHandler);

// ---------- start ----------
const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Create a .env file (see .env.example).");
  }
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});

module.exports = app;
