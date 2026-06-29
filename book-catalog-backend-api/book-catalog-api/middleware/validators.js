const { body, query, param, validationResult } = require("express-validator");
const Book = require("../models/Book");

// ── Run validation and return 400 on failure ──────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Book validators ───────────────────────────────────────────────────────────
const createBookRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }).withMessage("Title too long"),
  body("author").trim().notEmpty().withMessage("Author is required").isLength({ max: 100 }).withMessage("Author name too long"),
  body("genre")
    .notEmpty()
    .withMessage("Genre is required")
    .isIn(Book.schema.path("genre").enumValues)
    .withMessage(`Genre must be one of: ${Book.schema.path("genre").enumValues.join(", ")}`),
  body("publicationYear")
    .notEmpty()
    .withMessage("Publication year is required")
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage(`Publication year must be between 1000 and ${new Date().getFullYear()}`),
  body("availability").optional().isBoolean().withMessage("Availability must be a boolean"),
  body("isbn")
    .optional({ checkFalsy: true })
    .matches(/^(?:\d{9}[\dXx]|\d{13})$/)
    .withMessage("ISBN must be 10 or 13 digits"),
  body("description").optional().isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),
  body("totalCopies").optional().isInt({ min: 1 }).withMessage("Total copies must be at least 1"),
  body("availableCopies").optional().isInt({ min: 0 }).withMessage("Available copies cannot be negative"),
];

const updateBookRules = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty").isLength({ max: 200 }),
  body("author").optional().trim().notEmpty().withMessage("Author cannot be empty").isLength({ max: 100 }),
  body("genre")
    .optional()
    .isIn(Book.schema.path("genre").enumValues)
    .withMessage(`Genre must be one of: ${Book.schema.path("genre").enumValues.join(", ")}`),
  body("publicationYear")
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage(`Publication year must be between 1000 and ${new Date().getFullYear()}`),
  body("availability").optional().isBoolean().withMessage("Availability must be a boolean"),
  body("isbn")
    .optional({ checkFalsy: true })
    .matches(/^(?:\d{9}[\dXx]|\d{13})$/)
    .withMessage("ISBN must be 10 or 13 digits"),
  body("totalCopies").optional().isInt({ min: 1 }).withMessage("Total copies must be at least 1"),
  body("availableCopies").optional().isInt({ min: 0 }).withMessage("Available copies cannot be negative"),
];

const searchQueryRules = [
  query("q").optional().isString().withMessage("Search query must be a string"),
  query("title").optional().isString(),
  query("author").optional().isString(),
  query("genre")
    .optional()
    .isIn(Book.schema.path("genre").enumValues)
    .withMessage("Invalid genre"),
  query("availability").optional().isBoolean().withMessage("availability must be true or false"),
  query("yearFrom").optional().isInt({ min: 1000 }).withMessage("yearFrom must be a valid year"),
  query("yearTo").optional().isInt({ min: 1000 }).withMessage("yearTo must be a valid year"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("sortBy").optional().isIn(["title", "author", "publicationYear", "createdAt"]).withMessage("Invalid sortBy field"),
  query("order").optional().isIn(["asc", "desc"]).withMessage("order must be asc or desc"),
];

const mongoIdRule = [
  param("id").isMongoId().withMessage("Invalid book ID format"),
];

// ── Auth validators ───────────────────────────────────────────────────────────
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  validate,
  createBookRules,
  updateBookRules,
  searchQueryRules,
  mongoIdRule,
  registerRules,
  loginRules,
};
