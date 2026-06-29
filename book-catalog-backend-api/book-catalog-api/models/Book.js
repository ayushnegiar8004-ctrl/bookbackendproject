const mongoose = require("mongoose");

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Biography",
  "History",
  "Science",
  "Self-Help",
  "Children",
  "Young Adult",
  "Poetry",
  "Drama",
  "Other",
];

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
      maxlength: [100, "Author name cannot exceed 100 characters"],
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      enum: {
        values: GENRES,
        message: `Genre must be one of: ${GENRES.join(", ")}`,
      },
    },
    publicationYear: {
      type: Number,
      required: [true, "Publication year is required"],
      min: [1000, "Publication year must be after 1000"],
      max: [
        new Date().getFullYear(),
        `Publication year cannot be in the future`,
      ],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    isbn: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows multiple docs with no ISBN
      match: [
        /^(?:\d{9}[\dXx]|\d{13})$/,
        "ISBN must be 10 or 13 digits (ISBN-10 may end in X)",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },
    totalCopies: {
      type: Number,
      default: 1,
      min: [1, "Must have at least 1 copy"],
    },
    availableCopies: {
      type: Number,
      default: 1,
      min: [0, "Available copies cannot be negative"],
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    // Virtual for availability derived from copies
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Full-text search on title and author
bookSchema.index({ title: "text", author: "text" });
// Regular indexes for common filters
bookSchema.index({ genre: 1 });
bookSchema.index({ publicationYear: 1 });
bookSchema.index({ availability: 1 });
bookSchema.index({ author: 1 });

// ── Pre-save: sync availability flag with availableCopies ─────────────────────
bookSchema.pre("save", function (next) {
  this.availability = this.availableCopies > 0;
  next();
});

// ── Static: list all valid genres ─────────────────────────────────────────────
bookSchema.statics.getGenres = () => GENRES;

module.exports = mongoose.model("Book", bookSchema);
