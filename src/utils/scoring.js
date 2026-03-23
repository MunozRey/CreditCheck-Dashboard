import { T } from "../constants/themes.js";

// ─── LEAD SCORING ─────────────────────────────────────────────────────────────
// 100-point model. Factor breakdown:
//   Income adequacy   0-25pts  (ES median net ~1900€/mo)
//   DTI ES tranches   0-25pts  (Banco de España / LCCI Ley 5/2019)
//   Loan-to-Income    0-15pts
//   Employment        0-15pts
//   Email verified    0-10pts
//   Full name         0-5pts
//   Age fit           0-5pts   (peak creditworthiness 30-55)
// Grade distribution: A(≥75) ~20% · B(50-74) ~58% · C(30-49) ~20% · D(<30) rare

export function scoreLead(r) {
  let score = 0;

  const inc = parseFloat(r.income)   || 0;
  const exp = parseFloat(r.expenses) || 0;
  const loan= parseFloat(r.loanAmount)|| 0;

  // 1. Income adequacy (0-25pts)
  if      (inc >= 3500) score += 25;
  else if (inc >= 2500) score += 20;
  else if (inc >= 2000) score += 15;
  else if (inc >= 1500) score += 9;
  else if (inc >= 1000) score += 4;

  // 2. DTI — Banco de España 5 tranches (0-25pts)
  if (inc > 0 && exp > 0) {
    const dti = exp / inc;
    if      (dti < 0.30) score += 25;
    else if (dti < 0.35) score += 19;
    else if (dti < 0.40) score += 12;
    else if (dti < 0.50) score += 5;
  } else score += 10;

  // 3. Loan-to-Income ratio (0-15pts)
  if (loan > 0 && inc > 0) {
    const lti = loan / (inc * 12);
    if      (lti <= 0.5) score += 15;
    else if (lti <= 1.0) score += 11;
    else if (lti <= 2.0) score += 6;
    else if (lti <= 3.0) score += 2;
  } else score += 8;

  // 4. Employment stability (0-15pts)
  const emp = (r.employment || "").toLowerCase();
  if      (emp === "civil_servant")  score += 15;
  else if (emp === "employed")       score += 13;
  else if (emp === "self_employed")  score += 10;
  else if (emp === "retired")        score += 9;
  else if (emp === "part_time")      score += 5;
  else if (emp && emp !== "unemployed") score += 4;

  // 5. Email verified (0-10pts)
  if (r.emailVerified) score += 10;

  // 6. Full name (0-5pts)
  if ((r.name || "").trim().split(/\s+/).length >= 2) score += 5;

  // 7. Age fit (0-5pts)
  const age = parseFloat(r.age) || 0;
  if      (age >= 30 && age <= 55) score += 5;
  else if (age >= 25 && age <= 65) score += 3;
  else if (age > 0)                score += 1;

  return Math.min(Math.round(score), 100);
}

/**
 * Returns factor-by-factor breakdown of lead score (for LeadDrawer display).
 * Mirrors scoreLead() logic exactly — single source of truth.
 */
export function scoreLeadFactors(r) {
  const inc  = parseFloat(r.income)    || 0;
  const exp  = parseFloat(r.expenses)  || 0;
  const loan = parseFloat(r.loanAmount)|| 0;
  const emp  = (r.employment || "").toLowerCase();
  const age  = parseFloat(r.age) || 0;

  let incPts = 0;
  if      (inc >= 3500) incPts = 25;
  else if (inc >= 2500) incPts = 20;
  else if (inc >= 2000) incPts = 15;
  else if (inc >= 1500) incPts = 9;
  else if (inc >= 1000) incPts = 4;

  let dtiPts = 10;
  if (inc > 0 && exp > 0) {
    const dti = exp / inc;
    if      (dti < 0.30) dtiPts = 25;
    else if (dti < 0.35) dtiPts = 19;
    else if (dti < 0.40) dtiPts = 12;
    else if (dti < 0.50) dtiPts = 5;
    else                 dtiPts = 0;
  }

  let ltiPts = 8;
  if (loan > 0 && inc > 0) {
    const lti = loan / (inc * 12);
    if      (lti <= 0.5) ltiPts = 15;
    else if (lti <= 1.0) ltiPts = 11;
    else if (lti <= 2.0) ltiPts = 6;
    else if (lti <= 3.0) ltiPts = 2;
    else                 ltiPts = 0;
  }

  let empPts = 0;
  if      (emp === "civil_servant")             empPts = 15;
  else if (emp === "employed")                  empPts = 13;
  else if (emp === "self_employed")             empPts = 10;
  else if (emp === "retired")                   empPts = 9;
  else if (emp === "part_time")                 empPts = 5;
  else if (emp && emp !== "unemployed")         empPts = 4;

  const emailPts = r.emailVerified ? 10 : 0;
  const namePts  = (r.name || "").trim().split(/\s+/).length >= 2 ? 5 : 0;

  let agePts = 0;
  if      (age >= 30 && age <= 55) agePts = 5;
  else if (age >= 25 && age <= 65) agePts = 3;
  else if (age > 0)                agePts = 1;

  return [
    { label: "Monthly Income",  earned: incPts,   max: 25, detail: inc ? `€${inc.toLocaleString()}/mo` : "—" },
    { label: "DTI Ratio",       earned: dtiPts,   max: 25, detail: inc > 0 && exp > 0 ? `${(exp/inc*100).toFixed(0)}%` : "—" },
    { label: "Loan-to-Income",  earned: ltiPts,   max: 15, detail: loan > 0 && inc > 0 ? `${(loan/(inc*12)).toFixed(2)}×` : "—" },
    { label: "Employment",      earned: empPts,   max: 15, detail: emp ? emp.replace(/_/g, " ") : "—" },
    { label: "Email Verified",  earned: emailPts, max: 10, detail: r.emailVerified ? "Verified" : "Not verified" },
    { label: "Full Name",       earned: namePts,  max: 5,  detail: r.name ? `${(r.name||"").trim().split(/\s+/).length} word(s)` : "—" },
    { label: "Age Fit",         earned: agePts,   max: 5,  detail: age ? `${age} yrs` : "—" },
  ];
}

export const GRADE_COLOR = s => s>=75 ? T.green : s>=50 ? T.blue : s>=30 ? T.amber : T.red;
export const GRADE_LABEL = s => s>=75 ? "A" : s>=50 ? "B" : s>=30 ? "C" : "D";

export const EMP_OPTIONS = [
  {value:"all",           label:"All Employment"},
  {value:"civil_servant", label:"🏛 Civil Servant"},
  {value:"employed",      label:"💼 Employed"},
  {value:"self_employed", label:"🧑‍💻 Self-Employed"},
  {value:"retired",       label:"🧓 Retired"},
  {value:"part_time",     label:"⏱ Part-Time"},
  {value:"unemployed",    label:"⚠️ Unemployed"},
];
