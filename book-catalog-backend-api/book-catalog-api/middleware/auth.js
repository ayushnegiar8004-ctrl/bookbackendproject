const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// ── protect: verify JWT ───────────────────────────────────────────────────────
const protect = catchAsync(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return next(new AppError("Access denied. Please log in.", 401));
  }

  const token = auth.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid token. Please log in again.";
    return next(new AppError(msg, 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError("User no longer exists.", 401));

  req.user = user;
  next();
});

// ── restrictTo: role guard ────────────────────────────────────────────────────
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };

module.exports = { protect, restrictTo };
