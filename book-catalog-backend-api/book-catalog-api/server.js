require("dotenv").config();
const express = require("express");
const morgan  = require("morgan");

const connectDB     = require("./config/db");
const errorHandler  = require("./middleware/errorHandler");
const AppError      = require("./utils/AppError");

const app = express();

// ── Connect to MongoDB Atlas ──────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Basic CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",  require("./routes/auth"));
app.use("/api/books", require("./routes/books"));

// Health check
app.get("/", (req, res) =>
  res.json({
    success: true,
    message: "📚 Book Catalog API is running",
    version: "1.0.0",
    docs: "See README.md for full API documentation",
  })
);

// 404 catch-all
app.all("*", (req, res, next) =>
  next(new AppError(`Route ${req.originalUrl} not found.`, 404))
);

// Global error handler
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀  Server running → http://localhost:${PORT}  [${process.env.NODE_ENV || "development"}]`)
);
