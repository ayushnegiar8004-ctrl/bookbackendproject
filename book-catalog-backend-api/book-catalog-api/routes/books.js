const express = require("express");
const router = express.Router();

const {
  getAllBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  updateAvailability,
  deleteBook,
  getGenres,
  getCatalogStats,
} = require("../controllers/bookController");

const { protect, restrictTo } = require("../middleware/auth");
const {
  validate,
  createBookRules,
  updateBookRules,
  searchQueryRules,
  mongoIdRule,
} = require("../middleware/validators");

// ── Public routes (no auth required) ─────────────────────────────────────────
router.get("/genres", getGenres);
router.get("/stats",  protect, getCatalogStats);         // auth optional — keep for curiosity
router.get("/search", searchQueryRules, validate, searchBooks);
router.get("/",       searchQueryRules, validate, getAllBooks);
router.get("/:id",    mongoIdRule,      validate, getBookById);

// ── Protected routes (librarian or admin only) ────────────────────────────────
router.use(protect, restrictTo("librarian", "admin"));

router.post("/",                   createBookRules,  validate, createBook);
router.put("/:id",    mongoIdRule, updateBookRules,  validate, updateBook);
router.patch("/:id/availability",  mongoIdRule,      validate, updateAvailability);
router.delete("/:id", mongoIdRule,                            deleteBook);

module.exports = router;
