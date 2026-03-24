/**
 * Rate limiting middleware.
 * Global: 100 req/min per IP (configurable via env).
 * Auth: stricter 10 attempts/15 min to slow brute-force attacks.
 */

const rateLimit = require("express-rate-limit");

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000;
const max = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

const globalRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Stricter limiter applied only to /auth/login */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again in 15 minutes." },
});

module.exports = { globalRateLimiter, authRateLimiter };
