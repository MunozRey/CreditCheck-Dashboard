/**
 * CreditCheck Dashboard — Express app factory
 * Exportado sin llamar a listen() para que funcione como
 * serverless en Vercel y como servidor normal en local/Docker.
 */

require("dotenv").config();
const express = require("express");
const helmet  = require("helmet");
const cors    = require("cors");
const morgan  = require("morgan");

const authRoutes  = require("./routes/auth");
const leadsRoutes = require("./routes/leads");
const usersRoutes = require("./routes/users");
const { globalRateLimiter } = require("./middleware/rateLimiter");
const { httpsRedirect }     = require("./middleware/security");

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(httpsRedirect);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", "data:"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  })
);

app.use(
  cors({
    origin:         process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials:    true,
    methods:        ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Parsing ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: {
        write: (msg) =>
          process.stdout.write(
            msg.replace(/Authorization:\s*Bearer\s+[^\s]+/gi, "Authorization: Bearer [REDACTED]")
          ),
      },
    })
  );
}

// ─── Rate limiting ───────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Health ──────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/auth",  authRoutes);
app.use("/leads", leadsRoutes);
app.use("/users", usersRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ─── Error handler ───────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const body   = process.env.NODE_ENV === "production"
    ? { error: status === 500 ? "Internal server error" : err.message }
    : { error: err.message, stack: err.stack };
  res.status(status).json(body);
});

module.exports = app;
