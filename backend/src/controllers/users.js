/**
 * Users controller — admin-only team management.
 * Admins can list, invite, change role, and remove teammates.
 */

const prisma = require("../db");

/**
 * GET /users
 * Returns all users. Admin only.
 */
async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    return res.json({ data: users, count: users.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users
 * Body: { email: string, role?: "admin" | "viewer" }
 * Adds a new teammate. Admin only.
 * If the user already exists, returns 409 Conflict.
 */
async function addUser(req, res, next) {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const role  = req.body.role === "admin" ? "admin" : "viewer";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ error: "Valid email is required." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User already exists.", user: existing });
    }

    const user = await prisma.user.create({
      data: { email, role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id
 * Body: { role: "admin" | "viewer" }
 * Changes a user's role. Admin only. Cannot demote yourself.
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const role   = req.body.role === "admin" ? "admin" : "viewer";

    if (id === req.user.id) {
      return res.status(422).json({ error: "You cannot change your own role." });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User not found." });

    const user = await prisma.user.update({
      where: { id },
      data:  { role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /users/:id
 * Removes a teammate. Admin only. Cannot delete yourself.
 */
async function removeUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(422).json({ error: "You cannot remove yourself." });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User not found." });

    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, addUser, updateUser, removeUser };
