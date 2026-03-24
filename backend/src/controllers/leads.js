/**
 * Leads controller — CRUD for leads with activity logging.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /leads
 * Query params: product, stage, from (ISO date), to (ISO date)
 * Returns paginated list of leads matching filters.
 */
async function listLeads(req, res, next) {
  try {
    const { product, stage, from, to } = req.query;

    const where = {};
    if (product) where.product = product;
    if (stage) where.stage = stage;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { activities: true } } },
    });

    return res.json({ data: leads, count: leads.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /leads
 * Body: { companyName, contactName, contactEmail, product, stage, source, score? }
 * Creates a new lead and logs the creation as an activity.
 */
async function createLead(req, res, next) {
  try {
    const { companyName, contactName, contactEmail, product, stage, source, score } =
      req.body;

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          companyName,
          contactName,
          contactEmail,
          product,
          stage,
          source,
          score: score ?? 0,
        },
      });

      await tx.activityLog.create({
        data: {
          leadId: created.id,
          userId: req.user.id,
          action: "created",
          notes: `Lead created by ${req.user.email}`,
        },
      });

      return created;
    });

    return res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /leads/:id
 * Body: any subset of { stage, score, companyName, contactName, contactEmail }
 * Updates the lead and logs the change.
 */
async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const allowedFields = [
      "stage",
      "score",
      "companyName",
      "contactName",
      "contactEmail",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(422).json({ error: "No valid fields provided for update." });
    }

    const lead = await prisma.$transaction(async (tx) => {
      const existing = await tx.lead.findUnique({ where: { id } });
      if (!existing) {
        const err = new Error("Lead not found.");
        err.status = 404;
        throw err;
      }

      const updated = await tx.lead.update({ where: { id }, data: updates });

      const changedFields = Object.keys(updates).join(", ");
      await tx.activityLog.create({
        data: {
          leadId: id,
          userId: req.user.id,
          action: "updated",
          notes: `Updated fields: ${changedFields}`,
        },
      });

      return updated;
    });

    return res.json(lead);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /leads/:id/activity
 * Returns chronological activity log for a lead.
 */
async function getActivity(req, res, next) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: "Lead not found." });

    const activities = await prisma.activityLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, role: true } } },
    });

    return res.json({ data: activities });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /leads/:id/activity
 * Body: { action: string, notes?: string }
 * Logs a manual note or action against a lead.
 */
async function createActivity(req, res, next) {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: "Lead not found." });

    const activity = await prisma.activityLog.create({
      data: {
        leadId: id,
        userId: req.user.id,
        action,
        notes: notes || null,
      },
      include: { user: { select: { email: true } } },
    });

    return res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
}

module.exports = { listLeads, createLead, updateLead, getActivity, createActivity };
