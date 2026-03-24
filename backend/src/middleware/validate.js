/**
 * Validation helpers built on express-validator.
 * Each exported array is a middleware chain for a specific route.
 */

const { body, param, query, validationResult } = require("express-validator");

/** Respond with 422 if any validation rule failed. */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("A valid email address is required."),
  handleValidationErrors,
];

// ─── Leads ───────────────────────────────────────────────────────────────────

const VALID_PRODUCTS = ["creditcheck", "ibancheck"];
const VALID_STAGES = [
  "prospect",
  "contacted",
  "demo_scheduled",
  "demo_done",
  "proposal_sent",
  "negotiation",
  "closed_won",
  "closed_lost",
];

const validateCreateLead = [
  body("companyName").trim().notEmpty().withMessage("companyName is required."),
  body("contactName").trim().notEmpty().withMessage("contactName is required."),
  body("contactEmail")
    .isEmail()
    .normalizeEmail()
    .withMessage("A valid contactEmail is required."),
  body("product")
    .isIn(VALID_PRODUCTS)
    .withMessage(`product must be one of: ${VALID_PRODUCTS.join(", ")}.`),
  body("stage")
    .isIn(VALID_STAGES)
    .withMessage(`stage must be one of: ${VALID_STAGES.join(", ")}.`),
  body("source").trim().notEmpty().withMessage("source is required."),
  body("score")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("score must be an integer between 0 and 100."),
  handleValidationErrors,
];

const validateUpdateLead = [
  param("id").isUUID().withMessage("Lead id must be a valid UUID."),
  body("stage")
    .optional()
    .isIn(VALID_STAGES)
    .withMessage(`stage must be one of: ${VALID_STAGES.join(", ")}.`),
  body("score")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("score must be an integer between 0 and 100."),
  body("companyName").optional().trim().notEmpty(),
  body("contactName").optional().trim().notEmpty(),
  body("contactEmail").optional().isEmail().normalizeEmail(),
  handleValidationErrors,
];

const validateLeadIdParam = [
  param("id").isUUID().withMessage("Lead id must be a valid UUID."),
  handleValidationErrors,
];

const validateLeadsQuery = [
  query("product")
    .optional()
    .isIn(VALID_PRODUCTS)
    .withMessage(`product filter must be one of: ${VALID_PRODUCTS.join(", ")}.`),
  query("stage")
    .optional()
    .isIn(VALID_STAGES)
    .withMessage("Invalid stage filter."),
  query("from").optional().isISO8601().withMessage("from must be an ISO 8601 date."),
  query("to").optional().isISO8601().withMessage("to must be an ISO 8601 date."),
  handleValidationErrors,
];

// ─── Activity ────────────────────────────────────────────────────────────────

const validateCreateActivity = [
  param("id").isUUID().withMessage("Lead id must be a valid UUID."),
  body("action").trim().notEmpty().withMessage("action is required."),
  body("notes").optional().trim().isLength({ max: 2000 }),
  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateCreateLead,
  validateUpdateLead,
  validateLeadIdParam,
  validateLeadsQuery,
  validateCreateActivity,
};
