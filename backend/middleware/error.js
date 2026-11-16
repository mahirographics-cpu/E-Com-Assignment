function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.code === 11000) {
    status = 409;
    message = "That email is already registered.";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID.";
  } else if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 5 MB)." : err.message;
  }

  if (status === 500) console.error(err);
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
