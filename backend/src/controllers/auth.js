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

    // Whitelist check — read from env at request time so it can be updated
    // without redeploying (when using a secrets manager).
    const allowedEmails = (process.env.ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(email.toLowerCase())) {
      // Return 401, not 403, to avoid confirming valid emails to attackers.
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Upsert user record so new teammates are created automatically on first login.
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        email: email.toLowerCase(),
        role: "viewer",
      },
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
