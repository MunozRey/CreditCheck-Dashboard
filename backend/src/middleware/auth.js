/**
 * JWT authentication middleware.
 * Validates token signature, expiry, and attaches req.user.
 */

const jwt = require("jsonwebtoken");

/**
 * Require a valid Bearer JWT on every protected route.
 * Rejects with 401 on missing/invalid/expired tokens.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      // audience and issuer validation — both must match what we sign
      audience: "creditcheck-api",
      issuer: "clovrlabs",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }

  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
}

/**
 * Require the authenticated user to have the 'admin' role.
 * Must be used AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
