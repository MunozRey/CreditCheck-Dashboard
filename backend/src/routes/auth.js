const { Router } = require("express");
const { login, me } = require("../controllers/auth");
const { requireAuth } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");
const { validateLogin } = require("../middleware/validate");

const router = Router();

// POST /auth/login — email whitelist check, returns JWT
router.post("/login", authRateLimiter, validateLogin, login);

// GET /auth/me — return current user profile
router.get("/me", requireAuth, me);

module.exports = router;
