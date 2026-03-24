const { Router } = require("express");
const {
  listLeads,
  createLead,
  updateLead,
  getActivity,
  createActivity,
  batchCreateLeads,
} = require("../controllers/leads");
const { requireAuth } = require("../middleware/auth");
const {
  validateCreateLead,
  validateUpdateLead,
  validateLeadIdParam,
  validateLeadsQuery,
  validateCreateActivity,
} = require("../middleware/validate");

const router = Router();

// All leads routes require authentication
router.use(requireAuth);

// GET  /leads          — list all leads with optional filters
router.get("/", validateLeadsQuery, listLeads);

// POST /leads          — create a new lead
router.post("/", validateCreateLead, createLead);

// POST /leads/batch    — replace all leads with a full XLSX upload (bulk sync)
router.post("/batch", batchCreateLeads);

// PATCH /leads/:id     — update lead stage / score / fields
router.patch("/:id", validateUpdateLead, updateLead);

// GET  /leads/:id/activity — activity log for a lead
router.get("/:id/activity", validateLeadIdParam, getActivity);

// POST /leads/:id/activity — log a note or action
router.post("/:id/activity", validateCreateActivity, createActivity);

module.exports = router;
