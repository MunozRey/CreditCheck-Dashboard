/**
 * Database seed — creates the two initial admin users and sample leads.
 * Run with: npm run db:seed
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // ─── Users ─────────────────────────────────────────────────────────────────
  const allowedEmails = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of allowedEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { role: "admin" },
      create: { email, role: "admin" },
    });
    console.log(`  User upserted: ${email} (admin)`);
  }

  // ─── Sample leads ─────────────────────────────────────────────────────────
  const sampleLeads = [
    {
      companyName: "Acme Corp",
      contactName: "Jane Smith",
      contactEmail: "jane@acme.com",
      product: "creditcheck",
      stage: "demo_scheduled",
      source: "website",
      score: 72,
    },
    {
      companyName: "Fintech SL",
      contactName: "Carlos Ruiz",
      contactEmail: "carlos@fintech.es",
      product: "ibancheck",
      stage: "proposal_sent",
      source: "referral",
      score: 88,
    },
    {
      companyName: "BankWave",
      contactName: "Emma Müller",
      contactEmail: "emma@bankwave.de",
      product: "creditcheck",
      stage: "prospect",
      source: "linkedin",
      score: 45,
    },
  ];

  for (const lead of sampleLeads) {
    const created = await prisma.lead.create({ data: lead });
    console.log(`  Lead created: ${created.companyName} (${created.id})`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
