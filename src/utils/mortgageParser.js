// ─── MORTGAGE PARSER ──────────────────────────────────────────────────────────
// Parses the "MortgageRequests" sheet from the provider XLSX.
// Models a bank risk department view — every metric is credit-analyst meaningful.

// Assumed annual mortgage rate — change this one constant to update all calculations
export const ASSUMED_RATE = 0.035;

// Mirror of isTestEmail from xlsxParser.js — kept local to avoid circular imports
function isTestEmail(email) {
  if (!email) return true;
  const e = email.toLowerCase();
  return (
    e.includes("@clovrlabs.") ||
    e.includes("@clorvrlabs.") ||
    e === "test@test.com" ||
    e === "asd@asda.com" ||
    e === "ferran@test.com" ||
    e === "f@test.com" ||
    e === "a@xn--6ca.com" ||
    /^(test|asd|a|f)@/.test(e)
  );
}

function findCol(hdr, keywords) {
  for (const k of keywords) {
    const i = hdr.findIndex(h => h.includes(k));
    if (i !== -1) return i;
  }
  return -1;
}

function safeNum(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function safeStr(idx, row) {
  if (idx === -1) return "";
  return String(row[idx] || "").trim();
}

// Standard mortgage payment formula: P × r(1+r)^n / ((1+r)^n − 1)
function calcMonthlyPayment(loanAmount, termYears) {
  if (!loanAmount || !termYears || termYears <= 0) return null;
  const r = ASSUMED_RATE / 12;
  const n = termYears * 12;
  if (r === 0) return loanAmount / n;
  return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// Same formula but with a custom annual rate (for the Calculadora tab)
export function calcMonthlyPaymentAt(loanAmount, termYears, annualRate) {
  if (!loanAmount || !termYears || termYears <= 0) return null;
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return loanAmount / n;
  return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ─── RISK SCORE ────────────────────────────────────────────────────────────────
function computeRiskScore(lead) {
  let score = 0;

  // LTV (30 pts — most critical)
  if (lead.ltv !== null) {
    if      (lead.ltv <= 60) score += 30;
    else if (lead.ltv <= 70) score += 25;
    else if (lead.ltv <= 75) score += 20;
    else if (lead.ltv <= 80) score += 14;
    else if (lead.ltv <= 85) score += 8;
    else if (lead.ltv <= 90) score += 4;
    // >90 → 0
  }

  // Effort Ratio / Affordability (25 pts)
  if (lead.effortRatio === null) {
    score += 10; // unknown income or payment → partial credit
  } else {
    if      (lead.effortRatio < 20) score += 25;
    else if (lead.effortRatio < 25) score += 20;
    else if (lead.effortRatio < 30) score += 15;
    else if (lead.effortRatio < 35) score += 9;
    else if (lead.effortRatio < 40) score += 4;
    // ≥40 → 0
  }

  // Employment Stability (20 pts)
  const emp = String(lead.employment || "").toLowerCase().trim();
  if      (emp === "employed_permanent") score += 20;
  else if (emp === "civil_servant")      score += 20;
  else if (emp === "retired")            score += 14;
  else if (emp === "self_employed")      score += 11;
  else if (emp === "part_time")          score += 6;

  // Age at Maturity (15 pts)
  if (lead.ageAtMaturity !== null) {
    if      (lead.ageAtMaturity <= 65) score += 15;
    else if (lead.ageAtMaturity <= 70) score += 12;
    else if (lead.ageAtMaturity <= 75) score += 7;
    else if (lead.ageAtMaturity <= 80) score += 2;
    // >80 → 0
  }

  // Co-buyer & DTI (10 pts)
  if (lead.hasCobuyer) score += 5;
  if (lead.dti === null) {
    score += 2;
  } else {
    if      (lead.dti < 0.20) score += 5;
    else if (lead.dti < 0.30) score += 3;
    else if (lead.dti < 0.40) score += 1;
    // ≥0.40 → 0
  }

  return Math.min(100, score);
}

function tierFromScore(score) {
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

// ─── RISK FLAGS ────────────────────────────────────────────────────────────────
function computeRiskFlags(lead) {
  const flags = [];

  if (lead.ltv !== null) {
    if      (lead.ltv > 90)  flags.push({ level: "red",   label: "Critical LTV" });
    else if (lead.ltv >= 80) flags.push({ level: "amber", label: "High LTV" });
  }

  if (lead.effortRatio !== null) {
    if      (lead.effortRatio > 40)  flags.push({ level: "red",   label: "Excessive effort ratio" });
    else if (lead.effortRatio >= 35) flags.push({ level: "amber", label: "High effort ratio" });
  }

  if (lead.ageAtMaturity !== null) {
    if      (lead.ageAtMaturity > 80) flags.push({ level: "red",   label: "Very late maturity" });
    else if (lead.ageAtMaturity > 75) flags.push({ level: "amber", label: "Late maturity" });
  }

  if (lead.loanTermYears !== null && lead.loanTermYears > 35) {
    flags.push({ level: "amber", label: "Very long term" });
  }

  if (lead.employment === "self_employed" && lead.dti === null) {
    flags.push({ level: "amber", label: "Unverified income" });
  }

  if (lead.hasCobuyer) {
    flags.push({ level: "green", label: "Co-buyer" });
  }

  if (String(lead.searchStatus || "").toLowerCase() === "reserved") {
    flags.push({ level: "green", label: "Active reservation" });
  }

  return flags;
}

function statusToCat(status) {
  const s = String(status || "").toLowerCase().trim();
  if (s === "completed" || s === "verifying") return "Bank Connected";
  if (s === "pending")                         return "Form Submitted";
  return "Incomplete";
}

// ─── MAIN PARSER ───────────────────────────────────────────────────────────────
export function processMortgageRows(rows, headers) {
  const hdr = headers.map(h => String(h || "").toLowerCase().trim());
  const c   = kws => findCol(hdr, kws);

  const idC          = c(["id"]);
  const createdC     = c(["created"]);
  const nameC        = c(["name"]);
  const emailC       = c(["email"]);
  const ageC         = c(["age"]);
  const langC        = c(["language", "lang"]);
  const statusC      = c(["status"]);
  const purposeC     = c(["purpose"]);
  const searchStC    = c(["search status"]);
  const timelineC    = c(["timeline"]);
  const propTypeC    = c(["property type"]);
  const propLocC     = c(["property location"]);
  const propPriceC   = c(["property price"]);
  const downPayC     = c(["down payment"]);
  const loanTermC    = c(["loan term"]);
  const numBuyersC   = c(["number of buyers"]);
  const empC         = c(["employment status"]);
  const incomeC      = c(["monthly income"]);
  const existLoansC  = c(["existing loans"]);
  const loansAmtC    = c(["loans amount"]);
  const consentC     = c(["consent marketing"]);
  const emailVfC     = c(["email verified at"]);

  // Deduplicate by email — keep most recent Created
  const bestByEmail = {};
  for (const row of rows) {
    const email = String(row[emailC] || "").trim().toLowerCase();
    if (!email || isTestEmail(email)) continue;
    const dateStr = row[createdC] ? String(row[createdC]).slice(0, 10) : "0000-00-00";
    const cur = bestByEmail[email];
    if (!cur || dateStr > cur.date) {
      bestByEmail[email] = { date: dateStr, row };
    }
  }

  const res = { "Bank Connected": [], "Form Submitted": [], "Incomplete": [] };

  for (const { row } of Object.values(bestByEmail)) {
    const email = String(row[emailC] || "").trim().toLowerCase();

    // Raw numeric fields
    const propertyPrice  = safeNum(row[propPriceC]);
    const downPayment    = safeNum(row[downPayC]);
    const loanTermYears  = safeNum(row[loanTermC]);
    const monthlyIncome  = safeNum(row[incomeC]);
    const existingLoans  = safeNum(row[existLoansC]);
    const age            = safeNum(row[ageC]);
    const numBuyers      = safeNum(row[numBuyersC]);
    const employment     = safeStr(empC, row).toLowerCase();
    const searchStatus   = safeStr(searchStC, row).toLowerCase();

    // Derived metrics
    const loanAmount = (propertyPrice !== null && downPayment !== null)
      ? propertyPrice - downPayment : null;

    const ltv = (loanAmount !== null && propertyPrice !== null && propertyPrice > 0)
      ? Math.round((loanAmount / propertyPrice) * 1000) / 10 : null;

    const dti = (existingLoans !== null && monthlyIncome !== null && monthlyIncome > 0)
      ? existingLoans / monthlyIncome : null;

    const rawPayment    = calcMonthlyPayment(loanAmount, loanTermYears);
    const estPayment    = rawPayment !== null ? Math.round(rawPayment) : null;
    const effortRatio   = (rawPayment !== null && monthlyIncome !== null && monthlyIncome > 0)
      ? Math.round((rawPayment / monthlyIncome) * 1000) / 10 : null;

    const ageAtMaturity = (age !== null && loanTermYears !== null)
      ? age + loanTermYears : null;

    const hasCobuyer = numBuyers !== null && numBuyers >= 2;

    const lead = {
      // Original fields
      id:              safeStr(idC, row),
      created:         row[createdC] ? String(row[createdC]).slice(0, 10) : "",
      name:            safeStr(nameC, row),
      email,
      age,
      language:        safeStr(langC, row).toLowerCase(),
      status:          String(row[statusC] || "").toLowerCase().trim(),
      purpose:         safeStr(purposeC, row),
      searchStatus,
      timeline:        safeStr(timelineC, row).toLowerCase(),
      propertyType:    safeStr(propTypeC, row),
      location:        safeStr(propLocC, row),
      propertyPrice,
      downPayment,
      loanTermYears,
      numBuyers,
      employment,
      monthlyIncome,
      existingLoans,
      loansAmount:     safeNum(row[loansAmtC]),
      consentMarketing: !!(row[consentC]),
      emailVerified:    !!(row[emailVfC]),
      // Derived metrics
      loanAmount,
      ltv,
      dti,
      estimatedPayment: estPayment,
      effortRatio,
      ageAtMaturity,
      hasCobuyer,
      // Risk model (populated below)
      riskScore: 0,
      riskTier:  "D",
      riskFlags: [],
    };

    lead.riskScore = computeRiskScore(lead);
    lead.riskTier  = tierFromScore(lead.riskScore);
    lead.riskFlags = computeRiskFlags(lead);

    res[statusToCat(lead.status)].push(lead);
  }

  return res;
}

// ─── AGGREGATES ───────────────────────────────────────────────────────────────
export function mortgageAggregates(data) {
  const bc  = data["Bank Connected"]  || [];
  const fs  = data["Form Submitted"]  || [];
  const inc = data["Incomplete"]      || [];
  const all = [...bc, ...fs, ...inc];

  const total      = all.length;
  const bcCount    = bc.length;
  const fsCount    = fs.length;
  const incCount   = inc.length;

  const avg = (arr, key) => {
    const vals = arr.map(l => l[key]).filter(v => v !== null && v !== undefined);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  };

  const avgPropertyPrice = avg(all, "propertyPrice");
  const avgLoanAmount    = avg(all.filter(l => l.loanAmount !== null), "loanAmount");
  const avgLTV           = avg(all.filter(l => l.ltv !== null), "ltv");
  const avgEffortRatio   = avg(all.filter(l => l.effortRatio !== null), "effortRatio");
  const avgScore         = avg(all, "riskScore");
  const avgAgeAtMaturity = avg(all.filter(l => l.ageAtMaturity !== null), "ageAtMaturity");

  // LTV distribution
  const ltvBuckets = { "≤70%": 0, "71–80%": 0, "81–90%": 0, ">90%": 0, "N/A": 0 };
  for (const l of all) {
    if      (l.ltv === null) ltvBuckets["N/A"]++;
    else if (l.ltv <= 70)    ltvBuckets["≤70%"]++;
    else if (l.ltv <= 80)    ltvBuckets["71–80%"]++;
    else if (l.ltv <= 90)    ltvBuckets["81–90%"]++;
    else                     ltvBuckets[">90%"]++;
  }

  // Effort ratio distribution
  const effortBuckets = { "<25%": 0, "25–35%": 0, "35–40%": 0, ">40%": 0, "N/A": 0 };
  for (const l of all) {
    if      (l.effortRatio === null) effortBuckets["N/A"]++;
    else if (l.effortRatio < 25)     effortBuckets["<25%"]++;
    else if (l.effortRatio < 35)     effortBuckets["25–35%"]++;
    else if (l.effortRatio < 40)     effortBuckets["35–40%"]++;
    else                             effortBuckets[">40%"]++;
  }

  // Age at maturity distribution
  const ageBuckets = { "≤65": 0, "66–70": 0, "71–75": 0, "76–80": 0, ">80": 0, "N/A": 0 };
  for (const l of all) {
    if      (l.ageAtMaturity === null) ageBuckets["N/A"]++;
    else if (l.ageAtMaturity <= 65)    ageBuckets["≤65"]++;
    else if (l.ageAtMaturity <= 70)    ageBuckets["66–70"]++;
    else if (l.ageAtMaturity <= 75)    ageBuckets["71–75"]++;
    else if (l.ageAtMaturity <= 80)    ageBuckets["76–80"]++;
    else                               ageBuckets[">80"]++;
  }

  // Risk tier counts
  const tierCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const l of all) tierCounts[l.riskTier] = (tierCounts[l.riskTier] || 0) + 1;

  // Per-tier averages for the 2-axis insight table
  const tierStats = {};
  for (const tier of ["A", "B", "C", "D"]) {
    const tLeads = all.filter(l => l.riskTier === tier);
    tierStats[tier] = {
      count:       tLeads.length,
      pct:         total > 0 ? Math.round((tLeads.length / total) * 100) : 0,
      avgLTV:      avg(tLeads.filter(l => l.ltv !== null), "ltv"),
      avgEffort:   avg(tLeads.filter(l => l.effortRatio !== null), "effortRatio"),
    };
  }

  // Risk flag frequency
  const flagFreq = {};
  for (const l of all) {
    for (const f of l.riskFlags) {
      flagFreq[f.label] = (flagFreq[f.label] || { count: 0, level: f.level });
      flagFreq[f.label].count++;
    }
  }

  // Breakdown counts
  const countBy = key => {
    const map = {};
    for (const l of all) {
      const v = l[key] || "Unknown";
      map[v] = (map[v] || 0) + 1;
    }
    return map;
  };

  const propTypeCounts    = countBy("propertyType");
  const purposeCounts     = countBy("purpose");
  const timelineCounts    = countBy("timeline");
  const searchStatusCounts = countBy("searchStatus");
  const employmentCounts  = countBy("employment");
  const locationCounts    = countBy("location");

  const buyerDist = { "1 buyer": 0, "2+ buyers": 0 };
  for (const l of all) {
    if (l.hasCobuyer) buyerDist["2+ buyers"]++;
    else              buyerDist["1 buyer"]++;
  }

  // Hot leads: reserved + immediate, sorted by riskScore desc
  const hotLeads = all
    .filter(l => l.searchStatus === "reserved" && l.timeline === "immediate")
    .sort((a, b) => b.riskScore - a.riskScore);

  // Per-status pipeline stats
  const pipelineStats = {};
  for (const [cat, arr] of [["Bank Connected", bc], ["Form Submitted", fs], ["Incomplete", inc]]) {
    pipelineStats[cat] = {
      count:      arr.length,
      avgScore:   avg(arr, "riskScore"),
      avgLTV:     avg(arr.filter(l => l.ltv !== null), "ltv"),
      avgEffort:  avg(arr.filter(l => l.effortRatio !== null), "effortRatio"),
      avgPrice:   avg(arr.filter(l => l.propertyPrice !== null), "propertyPrice"),
    };
  }

  return {
    total, bc: bcCount, fs: fsCount, incomplete: incCount,
    avgPropertyPrice, avgLoanAmount, avgLTV, avgEffortRatio, avgScore, avgAgeAtMaturity,
    ltvBuckets, effortBuckets, ageBuckets,
    tierCounts, tierStats,
    flagFreq,
    propTypeCounts, purposeCounts, timelineCounts,
    searchStatusCounts, employmentCounts, locationCounts,
    buyerDist, hotLeads, pipelineStats,
  };
}
