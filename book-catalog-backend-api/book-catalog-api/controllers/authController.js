const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const respond = (res, statusCode, user) =>
  res.status(statusCode).json({
    success: true,
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });

// POST /api/auth/register
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return next(new AppError("Email is already registered.", 409));

  // Only allow admin to set roles other than "user"
  const safeRole = ["librarian", "admin"].includes(role) ? "user" : role;
  const user = await User.create({ name, email, password, role: safeRole || "user" });

  respond(res, 201, user);
});

// POST /api/auth/login
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  respond(res, 200, user);
});

// GET /api/auth/me
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = { register, login, getMe };
