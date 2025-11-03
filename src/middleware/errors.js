export function errorHandler(err, req, res, next) {

  const code = err.code && Number.isInteger(err.code) ? err.code : 500;
  res.status(code).json({
    error: err.message || "Internal Server Error",
  });
}
