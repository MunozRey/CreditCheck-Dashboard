const { Router } = require("express");
const { listUsers, addUser, updateUser, removeUser } = require("../controllers/users");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = Router();

// All user-management routes require a valid JWT + admin role
router.use(requireAuth, requireAdmin);

router.get("/",     listUsers);   // GET  /users
router.post("/",    addUser);     // POST /users
router.patch("/:id", updateUser); // PATCH /users/:id
router.delete("/:id", removeUser);// DELETE /users/:id

module.exports = router;
