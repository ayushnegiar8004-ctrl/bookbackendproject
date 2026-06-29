/**
 * Seeder — populates the database with sample books and a librarian account.
 * Run:  node seed.js          (import)
 *       node seed.js --delete (wipe all books & users)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const Book     = require("./models/Book");
const User     = require("./models/User");
const connectDB = require("./config/db");

const sampleBooks = [
  { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Fiction", publicationYear: 1960, totalCopies: 5, availableCopies: 3, isbn: "9780061935466", description: "A classic novel about racial injustice and moral growth in the American South." },
  { title: "1984", author: "George Orwell", genre: "Science Fiction", publicationYear: 1949, totalCopies: 4, availableCopies: 4, isbn: "9780451524935", description: "A dystopian novel set in a totalitarian society under constant surveillance." },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Fiction", publicationYear: 1925, totalCopies: 3, availableCopies: 1, isbn: "9780743273565", description: "A story of wealth, love, and the American Dream in the 1920s." },
  { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy", publicationYear: 1997, totalCopies: 8, availableCopies: 5, isbn: "9780439708180", description: "A young boy discovers he is a wizard and enters a magical world." },
  { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", publicationYear: 1937, totalCopies: 4, availableCopies: 2, isbn: "9780547928227", description: "Bilbo Baggins sets off on an unexpected journey with a company of dwarves." },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", genre: "History", publicationYear: 2011, totalCopies: 3, availableCopies: 3, isbn: "9780062316097", description: "A sweeping narrative of human history from the Stone Age to the present." },
  { title: "The Shining", author: "Stephen King", genre: "Horror", publicationYear: 1977, totalCopies: 2, availableCopies: 0, isbn: "9780307743657", description: "A family becomes snowbound in a haunted hotel with terrifying results." },
  { title: "Gone Girl", author: "Gillian Flynn", genre: "Thriller", publicationYear: 2012, totalCopies: 3, availableCopies: 2, isbn: "9780307588371", description: "A psychological thriller about a marriage gone very wrong." },
  { title: "The Alchemist", author: "Paulo Coelho", genre: "Fiction", publicationYear: 1988, totalCopies: 5, availableCopies: 5, isbn: "9780062315007", description: "A young shepherd's journey to find treasure and meaning." },
  { title: "A Brief History of Time", author: "Stephen Hawking", genre: "Science", publicationYear: 1988, totalCopies: 2, availableCopies: 2, isbn: "9780553380163", description: "Hawking's landmark exploration of cosmology for a general audience." },
];

const seed = async () => {
  await connectDB();

  if (process.argv.includes("--delete")) {
    await Book.deleteMany();
    await User.deleteMany();
    console.log("🗑️  All books and users deleted.");
    process.exit(0);
  }

  // Create a librarian account
  const librarianExists = await User.findOne({ email: "librarian@library.com" });
  if (!librarianExists) {
    await User.create({
      name: "Head Librarian",
      email: "librarian@library.com",
      password: "librarian123",
      role: "librarian",
    });
    console.log("👤  Librarian account created → librarian@library.com / librarian123");
  }

  // Insert books
  await Book.deleteMany(); // fresh slate
  await Book.insertMany(sampleBooks);
  console.log(`📚  Inserted ${sampleBooks.length} sample books.`);

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
