/**
 * CreditCheck Dashboard — Express API entry point
 * Clovr Labs
 */

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const leadsRoutes = require("./routes/leads");
const { globalRateLimiter } = require("./middleware/rateLimiter");
const { httpsRedirect } = require("./middleware/security");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ─────────────────────────────────────────────────────
app.use(httpsRedirect);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Request parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Logging (skip in test) ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      // Redact Authorization header from logs to avoid leaking tokens
      stream: {
        write: (message) => {
          const sanitized = message.replace(
            /Authorization:\s*Bearer\s+[^\s]+/gi,
            "Authorization: Bearer [REDACTED]"
          );
          process.stdout.write(sanitized);
        },
      },
    })
  );
}

// ─── Rate limiting ───────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Health check (no auth required) ────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/leads", leadsRoutes);

// ─── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Never leak stack traces in production
  const body =
    process.env.NODE_ENV === "production"
      ? { error: status === 500 ? "Internal server error" : err.message }
      : { error: err.message, stack: err.stack };

  res.status(status).json(body);
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(
    `[creditcheck-api] Listening on port ${PORT} (${process.env.NODE_ENV || "development"})`
  );
});

module.exports = app;
