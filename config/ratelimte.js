import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 15 min
  max: 500,
  message: "Too many requests",
});

export { limiter };
