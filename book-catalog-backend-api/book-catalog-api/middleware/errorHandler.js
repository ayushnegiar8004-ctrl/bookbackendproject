const AppError = require("../utils/AppError");

const handleCastError = (err) =>
  new AppError(`Invalid value for field "${err.path}".`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(
    `A book with that ${field} already exists. Please use a different value.`,
    409
  );
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation error: ${messages.join(" | ")}`, 400);
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Mongoose-specific errors → convert to AppError
  let error = { ...err, message: err.message };
  if (err.name === "CastError") error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKey(err);
  if (err.name === "ValidationError") error = handleValidationError(err);

  // Operational errors: send message to client
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Programming/unknown errors: don't leak details
  console.error("💥 UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};

module.exports = errorHandler;
