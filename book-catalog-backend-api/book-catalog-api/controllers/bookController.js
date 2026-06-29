const Book = require("../models/Book");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const paginate = require("../utils/paginate");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books
// Query params: q, title, author, genre, availability, yearFrom, yearTo,
//               page, limit, sortBy, order
// ─────────────────────────────────────────────────────────────────────────────
const getAllBooks = catchAsync(async (req, res) => {
  const {
    q,
    title,
    author,
    genre,
    availability,
    yearFrom,
    yearTo,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  const filter = {};

  // ── Full-text search across title + author ──────────────────────────────
  if (q) {
    filter.$text = { $search: q };
  }

  // ── Field-specific partial matches (case-insensitive regex) ─────────────
  if (title) filter.title = { $regex: title, $options: "i" };
  if (author) filter.author = { $regex: author, $options: "i" };

  // ── Exact / enum filters ────────────────────────────────────────────────
  if (genre) filter.genre = genre;
  if (availability !== undefined) filter.availability = availability === "true";

  // ── Year range ──────────────────────────────────────────────────────────
  if (yearFrom || yearTo) {
    filter.publicationYear = {};
    if (yearFrom) filter.publicationYear.$gte = Number(yearFrom);
    if (yearTo) filter.publicationYear.$lte = Number(yearTo);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = order === "asc" ? 1 : -1;

  const [books, total] = await Promise.all([
    Book.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit))
      .populate("addedBy", "name email"),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    pagination: paginate(total, Number(page), Number(limit)),
    data: books,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books/search
// Dedicated search endpoint — searches by title OR author (partial, case-insensitive)
// Query params: q (searches both), title, author
// ─────────────────────────────────────────────────────────────────────────────
const searchBooks = catchAsync(async (req, res, next) => {
  const { q, title, author, page = 1, limit = 10 } = req.query;

  if (!q && !title && !author) {
    return next(
      new AppError(
        "Provide at least one search parameter: q (general), title, or author.",
        400
      )
    );
  }

  const orConditions = [];

  if (q) {
    orConditions.push(
      { title: { $regex: q, $options: "i" } },
      { author: { $regex: q, $options: "i" } }
    );
  }
  if (title) orConditions.push({ title: { $regex: title, $options: "i" } });
  if (author) orConditions.push({ author: { $regex: author, $options: "i" } });

  const filter = { $or: orConditions };
  const skip = (Number(page) - 1) * Number(limit);

  const [books, total] = await Promise.all([
    Book.find(filter)
      .sort({ title: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("addedBy", "name email"),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    query: { q, title, author },
    pagination: paginate(total, Number(page), Number(limit)),
    data: books,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books/:id
// ─────────────────────────────────────────────────────────────────────────────
const getBookById = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id).populate("addedBy", "name email");
  if (!book) return next(new AppError("Book not found.", 404));

  res.status(200).json({ success: true, data: book });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/books
// ─────────────────────────────────────────────────────────────────────────────
const createBook = catchAsync(async (req, res) => {
  const {
    title,
    author,
    genre,
    publicationYear,
    availability,
    isbn,
    description,
    coverImage,
    totalCopies,
    availableCopies,
  } = req.body;

  const copies = totalCopies ?? 1;

  const book = await Book.create({
    title,
    author,
    genre,
    publicationYear,
    isbn,
    description,
    coverImage,
    totalCopies: copies,
    availableCopies: availableCopies ?? copies,
    addedBy: req.user?._id,
  });

  // If caller explicitly set availability, honour it (pre-save will recalculate
  // availability from copies, so only override if no copies provided)
  if (availability !== undefined && availableCopies === undefined) {
    book.availability = availability;
    await book.save();
  }

  res.status(201).json({ success: true, data: book });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/books/:id  — full replacement of mutable fields
// ─────────────────────────────────────────────────────────────────────────────
const updateBook = catchAsync(async (req, res, next) => {
  const allowed = [
    "title",
    "author",
    "genre",
    "publicationYear",
    "availability",
    "isbn",
    "description",
    "coverImage",
    "totalCopies",
    "availableCopies",
  ];

  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError("No valid fields provided for update.", 400));
  }

  const book = await Book.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate("addedBy", "name email");

  if (!book) return next(new AppError("Book not found.", 404));

  // Re-run pre-save to sync availability flag
  await book.save();

  res.status(200).json({ success: true, data: book });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/books/:id/availability
// Quickly toggle or set availability without a full update
// ─────────────────────────────────────────────────────────────────────────────
const updateAvailability = catchAsync(async (req, res, next) => {
  const { availability, availableCopies } = req.body;

  if (availability === undefined && availableCopies === undefined) {
    return next(
      new AppError("Provide 'availability' (boolean) or 'availableCopies' (number).", 400)
    );
  }

  const book = await Book.findById(req.params.id);
  if (!book) return next(new AppError("Book not found.", 404));

  if (availableCopies !== undefined) {
    if (availableCopies > book.totalCopies) {
      return next(
        new AppError(
          `Available copies (${availableCopies}) cannot exceed total copies (${book.totalCopies}).`,
          400
        )
      );
    }
    book.availableCopies = availableCopies;
  } else {
    book.availability = availability;
    book.availableCopies = availability ? book.totalCopies : 0;
  }

  await book.save(); // triggers pre-save sync

  res.status(200).json({
    success: true,
    message: `Book is now ${book.availability ? "available" : "unavailable"}.`,
    data: book,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/books/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return next(new AppError("Book not found.", 404));

  res.status(200).json({
    success: true,
    message: `"${book.title}" has been removed from the catalog.`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books/genres — list all valid genres
// ─────────────────────────────────────────────────────────────────────────────
const getGenres = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    data: Book.getGenres(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books/stats — catalog statistics
// ─────────────────────────────────────────────────────────────────────────────
const getCatalogStats = catchAsync(async (req, res) => {
  const [totalBooks, availableBooks, genreBreakdown, yearRange] =
    await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ availability: true }),
      Book.aggregate([
        { $group: { _id: "$genre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Book.aggregate([
        {
          $group: {
            _id: null,
            oldest: { $min: "$publicationYear" },
            newest: { $max: "$publicationYear" },
          },
        },
      ]),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totalBooks,
      availableBooks,
      unavailableBooks: totalBooks - availableBooks,
      genreBreakdown: genreBreakdown.map((g) => ({
        genre: g._id,
        count: g.count,
      })),
      yearRange: yearRange[0]
        ? { oldest: yearRange[0].oldest, newest: yearRange[0].newest }
        : null,
    },
  });
});

module.exports = {
  getAllBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  updateAvailability,
  deleteBook,
  getGenres,
  getCatalogStats,
};
