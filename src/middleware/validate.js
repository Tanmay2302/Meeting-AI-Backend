// If you ever need route-level schema validation middleware
export const validate = (schema) => (req, res, next) => {
  try {
    req.validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    res
      .status(400)
      .json({ error: "Invalid request", details: err.errors ?? String(err) });
  }
};
