/**
 * Auth controller — login only.
 * No passwords: uses email whitelist + JWT.
 * For production you would add magic-link or OAuth; this is the
 * simplest secure pattern for a small internal team.
 */

const jwt    = require("jsonwebtoken");
const prisma = require("../db");

/**
 * POST /auth/login
 * Body: { email: string }
 * Returns a signed JWT if email is on the whitelist.
 */
async function login(req, res, next) {
  try {
    const { email } = req.body;

    const normalEmail = email.toLowerCase();

    // Whitelist check — env var (always allowed) OR user exists in DB
    const allowedEnv = (process.env.ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const existingUser = await prisma.user.findUnique({ where: { email: normalEmail } });

    if (!allowedEnv.includes(normalEmail) && !existingUser) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Upsert — env-var users get admin, DB-added users keep their existing role.
    const role = allowedEnv.includes(normalEmail) ? "admin" : (existingUser?.role ?? "viewer");
    const user = await prisma.user.upsert({
      where: { email: normalEmail },
      update: {},
      create: { email: normalEmail, role },
    });

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        algorithm: "HS256",
        audience: "creditcheck-api",
        issuer: "clovrlabs",
      }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/me
 * Returns the currently authenticated user's profile.
 */
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
