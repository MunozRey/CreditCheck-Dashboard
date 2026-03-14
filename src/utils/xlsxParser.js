// ─── XLSX PARSER ─────────────────────────────────────────────────────────────
// Supports both CreditScore/Rasmus format and Pipedrive format.
// Deduplicates by email, preferring better status and higher score.

export function isTestEmail(email) {
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

export function processRows(rows, headers) {
  const hdr = headers.map(h => String(h||"").toLowerCase().trim());
  const col = kws => { for (const k of kws) { const i = hdr.findIndex(h => h.includes(k)); if (i !== -1) return i; } return -1; };

  const hasStatus = col(["status"]) !== -1;
  const hasVerifJob = col(["verification job"]) !== -1;

  if (hasStatus && hasVerifJob) {
    // ── CreditScore format (Rasmus XLSX) ──────────────────────────────────
    const nameC   = col(["name"]);
    const emailC  = col(["email"]);
    const dateC   = col(["created"]);
    const statusC = col(["status"]);
    const verifC  = col(["verification job"]);
    const ageC    = col(["age"]);
    const incomeC = col(["monthly net income"]);
    const expC    = col(["monthly expenses"]);
    const loanAmtC= col(["desired loan amount"]);
    const loanMoC = col(["installment months"]);
    const purposeC= col(["loan purpose"]);
    const empC    = col(["employment status"]);
    const residC  = col(["residential status"]);
    const emergC  = col(["emergency fund"]);
    const emailVfC= col(["email verified at"]);
    const pdfC    = col(["pdf generated"]);
    const existC  = col(["existing loan"]);
    const accCostC= col(["accommodation cost"]);
    const langC   = col(["language","lang"]);
    const safeCol = (idx, row) => idx !== -1 ? row[idx] : null;

    const statusPriority = (status, verif) => {
      const s = String(status||"").toLowerCase();
      const v = String(verif||"").toLowerCase();
      if (s === "completed")                        return 0;
      if (s === "verifying" && v === "matched")     return 1;
      if (s === "verifying" && v === "mismatch")    return 2;
      if (s === "verifying" && v === "consent")     return 3;
      if (s === "pending"   && v === "pending")     return 4;
      if (s === "cancelled")                        return 5;
      return 6;
    };

    const catFromPriority = p => {
      if (p <= 3) return "Bank Connected";
      if (p === 4) return "Form Submitted";
      return "Incomplete";
    };

    const quickScore = row => {
      let s = 0;
      const inc  = parseFloat(row[incomeC])  || 0;
      const exp  = parseFloat(row[expC])     || 0;
      const loan = parseFloat(row[loanAmtC]) || 0;
      if      (inc>=3500) s+=25; else if (inc>=2500) s+=20;
      else if (inc>=2000) s+=15; else if (inc>=1500) s+=9; else if (inc>=1000) s+=4;
      if (inc>0&&exp>0) {
        const dti=exp/inc;
        if      (dti<0.30) s+=25; else if (dti<0.35) s+=19;
        else if (dti<0.40) s+=12; else if (dti<0.50) s+=5;
      } else s+=10;
      if (loan>0&&inc>0) {
        const lti=loan/(inc*12);
        if (lti<=0.5) s+=15; else if (lti<=1.0) s+=11;
        else if (lti<=2.0) s+=6; else if (lti<=3.0) s+=2;
      } else s+=8;
      const emp=String(row[empC]||"").toLowerCase();
      if      (emp==="civil_servant") s+=15; else if (emp==="employed") s+=13;
      else if (emp==="self_employed") s+=10; else if (emp==="retired")  s+=9;
      else if (emp==="part_time")     s+=5;  else if (emp&&emp!=="unemployed") s+=4;
      const dateStr = row[dateC] ? String(row[dateC]).slice(0,10) : "0000-00-00";
      return { score: s, date: dateStr };
    };

    const bestByEmail = {};
    for (const row of rows) {
      const email = String(row[emailC] || "").trim().toLowerCase();
      if (!email || isTestEmail(email)) continue;
      const pri = statusPriority(row[statusC], row[verifC]);
      const { score, date } = quickScore(row);
      const cur = bestByEmail[email];
      if (!cur) {
        bestByEmail[email] = { pri, score, date, row };
      } else if (pri < cur.pri) {
        bestByEmail[email] = { pri, score, date, row };
      } else if (pri === cur.pri) {
        if (score > cur.score || (score === cur.score && date > cur.date)) {
          bestByEmail[email] = { pri, score, date, row };
        }
      }
    }

    const res = {"Bank Connected":[], "Form Submitted":[], "Incomplete":[]};
    for (const { pri, row } of Object.values(bestByEmail)) {
      const email = String(row[emailC]||"").trim().toLowerCase();
      const lead = {
        name:    String(row[nameC]||"").trim(),
        email,
        created: row[dateC] ? String(row[dateC]).slice(0,10) : "",
        age:          safeCol(ageC, row),
        income:       safeCol(incomeC, row),
        expenses:     safeCol(expC, row),
        loanAmount:   safeCol(loanAmtC, row),
        loanMonths:   safeCol(loanMoC, row),
        purpose:      row[purposeC] || "",
        employment:   row[empC]     || "",
        residential:  row[residC]   || "",
        emergency:    row[emergC]   || "",
        emailVerified: !!row[emailVfC],
        pdfGenerated:  !!row[pdfC],
        existingLoans: safeCol(existC, row),
        accomCost:     safeCol(accCostC, row),
        status:  String(row[statusC]||"").toLowerCase(),
        verif:   String(row[verifC]||"").toLowerCase(),
        language: langC !== -1 && row[langC] ? String(row[langC]).toLowerCase().trim() : null,
        country: (()=>{
          const lang = langC !== -1 && row[langC] ? String(row[langC]).toLowerCase().trim() : null;
          if (!lang) return null;
          const MAP = {spanish:"es",español:"es",castellano:"es",catalan:"es",català:"es",english:"en",portuguese:"pt",português:"pt",italian:"it",italiano:"it",french:"fr",français:"fr",german:"de",deutsch:"de",dutch:"nl",nederlands:"nl",polish:"pl",polski:"pl"};
          return MAP[lang] || lang;
        })(),
      };
      res[catFromPriority(pri)].push(lead);
    }
    return res;

  } else {
    // ── Pipedrive format (original) ───────────────────────────────────────
    const nameC  = col(["person - name","name"]);
    const emailC = col(["person - email","email"]);
    const titleC = col(["lead - title","lead title"]);
    const dateC  = col(["lead created","created"]);
    const PRI    = {"Bank Connected":0,"Form Submitted":1};
    const seen   = {}, res = {"Bank Connected":[], "Form Submitted":[], "Incomplete":[]};
    for (const row of rows) {
      const t = String(row[titleC]||"").toLowerCase();
      const cat = t.includes("bank connected") ? "Bank Connected"
                : t.includes("form submitted") ? "Form Submitted"
                : t.includes("cta")            ? "Form Submitted"
                : t.includes("account verification") ? "Form Submitted"
                : t.includes("iban check")     ? "Form Submitted"
                : null;
      if (!cat) continue;
      const email = String(row[emailC]||"").trim().toLowerCase();
      if (isTestEmail(email)) continue;
      const lead  = { name:String(row[nameC]||"").trim(), email, created:row[dateC]?String(row[dateC]).slice(0,10):"", purpose:"" };
      if (email) { if (seen[email]===undefined||PRI[cat]<seen[email].p) seen[email]={cat,lead,p:PRI[cat]}; }
      else res[cat].push(lead);
    }
    for (const {cat,lead} of Object.values(seen)) res[cat].push(lead);
    return res;
  }
}
