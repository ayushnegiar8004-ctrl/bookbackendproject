# 📚 Book Catalog API

A production-ready library book catalog backend built with **Node.js**, **Express**, **MongoDB Atlas**, and **JWT Authentication**.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# → Fill in your MONGODB_URI and JWT_SECRET

# 3. (Optional) Seed sample data
node seed.js

# 4. Start the server
npm run dev       # development (auto-restart)
npm start         # production
```

---

## 🔧 MongoDB Atlas Setup

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com) and create a **free cluster**
2. Under **Database Access**, create a user with read/write permissions
3. Under **Network Access**, add your IP (or `0.0.0.0/0` for all IPs)
4. Click **Connect → Drivers**, copy the connection string
5. Paste into `.env` as `MONGODB_URI`, replacing `<username>` and `<password>`

---

## 👤 User Roles

| Role        | Permissions                              |
|-------------|------------------------------------------|
| `user`      | Read books, search catalog               |
| `librarian` | + Create, update, delete books           |
| `admin`     | + All librarian permissions              |

---

## 📡 API Reference

### Base URL
```
http://localhost:5000
```

---

### 🔐 Auth — `/api/auth`

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```
**Response 201:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "user" }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "jane@example.com", "password": "secret123" }
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 📖 Books — `/api/books`

All **write** operations require `Authorization: Bearer <token>` with role `librarian` or `admin`.

---

#### Get All Books
```http
GET /api/books
```

**Query parameters:**

| Param          | Type    | Description                                          |
|----------------|---------|------------------------------------------------------|
| `q`            | string  | Full-text search across title and author             |
| `title`        | string  | Partial, case-insensitive title filter               |
| `author`       | string  | Partial, case-insensitive author filter              |
| `genre`        | string  | Exact genre match                                    |
| `availability` | boolean | `true` = available only, `false` = unavailable only  |
| `yearFrom`     | number  | Minimum publication year                             |
| `yearTo`       | number  | Maximum publication year                             |
| `sortBy`       | string  | `title` \| `author` \| `publicationYear` \| `createdAt` |
| `order`        | string  | `asc` \| `desc` (default: `desc`)                   |
| `page`         | number  | Page number (default: 1)                             |
| `limit`        | number  | Results per page, max 100 (default: 10)              |

**Examples:**
```
GET /api/books?genre=Fantasy&availability=true
GET /api/books?yearFrom=2000&yearTo=2020&sortBy=publicationYear&order=asc
GET /api/books?q=tolkien&page=1&limit=5
```

---

#### Search Books (dedicated endpoint)
```http
GET /api/books/search?q=harry potter
GET /api/books/search?author=tolkien
GET /api/books/search?title=1984&author=orwell
```

Returns books matching title **OR** author against the provided terms.

---

#### Get Single Book
```http
GET /api/books/:id
```

---

#### Create Book *(librarian/admin)*
```http
POST /api/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Dune",
  "author": "Frank Herbert",
  "genre": "Science Fiction",
  "publicationYear": 1965,
  "isbn": "9780441013593",
  "description": "Epic science fiction novel set in a distant future.",
  "totalCopies": 3,
  "availableCopies": 3
}
```

**Required fields:** `title`, `author`, `genre`, `publicationYear`

---

#### Update Book *(librarian/admin)*
```http
PUT /api/books/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "totalCopies": 5,
  "availableCopies": 4,
  "description": "Updated description"
}
```
All fields are optional — send only what you want to change.

---

#### Update Availability *(librarian/admin)*
```http
PATCH /api/books/:id/availability
Authorization: Bearer <token>
Content-Type: application/json

{ "availableCopies": 2 }
// or
{ "availability": false }
```

---

#### Delete Book *(librarian/admin)*
```http
DELETE /api/books/:id
Authorization: Bearer <token>
```

---

#### Get All Genres
```http
GET /api/books/genres
```

---

#### Catalog Statistics
```http
GET /api/books/stats
Authorization: Bearer <token>
```
Returns total books, available/unavailable counts, per-genre breakdown, and year range.

---

## 🧬 Book Schema

| Field             | Type    | Required | Default | Description                                |
|-------------------|---------|----------|---------|--------------------------------------------|
| `title`           | String  | ✅       | —       | Book title (max 200 chars)                 |
| `author`          | String  | ✅       | —       | Author name (max 100 chars)                |
| `genre`           | String  | ✅       | —       | One of 17 valid genres                     |
| `publicationYear` | Number  | ✅       | —       | 1000 – current year                        |
| `availability`    | Boolean | —        | `true`  | Auto-synced from `availableCopies`         |
| `isbn`            | String  | —        | —       | 10 or 13 digit ISBN (unique if provided)   |
| `description`     | String  | —        | `""`    | Short summary (max 1000 chars)             |
| `coverImage`      | String  | —        | `""`    | URL to cover image                         |
| `totalCopies`     | Number  | —        | `1`     | Total copies in library                    |
| `availableCopies` | Number  | —        | `1`     | Copies available for checkout              |

**Valid genres:** Fiction, Non-Fiction, Science Fiction, Fantasy, Mystery, Thriller, Romance, Horror, Biography, History, Science, Self-Help, Children, Young Adult, Poetry, Drama, Other

---

## 🏗️ Project Structure

```
book-catalog-api/
├── config/
│   └── db.js                  # MongoDB Atlas connection
├── controllers/
│   ├── authController.js      # Register, login, getMe
│   └── bookController.js      # CRUD, search, stats, genres
├── middleware/
│   ├── auth.js                # JWT protect + restrictTo
│   ├── errorHandler.js        # Global error handler
│   └── validators.js          # express-validator rules
├── models/
│   ├── Book.js                # Book schema + text index
│   └── User.js                # User schema (roles + bcrypt)
├── routes/
│   ├── auth.js
│   └── books.js
├── utils/
│   ├── AppError.js            # Operational error class
│   ├── catchAsync.js          # Async error wrapper
│   └── paginate.js            # Pagination metadata builder
├── seed.js                    # Sample data seeder
├── server.js                  # App entry point
└── .env.example
```

---

## 🔑 Seeded Librarian Account

After running `node seed.js`:
```
Email:    librarian@library.com
Password: librarian123
Role:     librarian
```
