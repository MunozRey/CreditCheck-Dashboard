import { VERTICALS_DEF } from '../constants/verticals.js';

// REPORT_DEFS — T.* used for React UI card styling only (bgColor, tagBg)
export const getReportDefs = (T) => [
  // ── INTERNAL ────────────────────────────────────────────────────────────────
  {
    id:"ops_full",
    category:"internal",
    icon:"",
    label:"Operations Report",
    audience:"Management & Ops team",
    desc:"Full pipeline view: quality score, domain breakdown, DTI analysis, email health, funnel with drop-off, financial profile. Confidential.",
    tags:["Quality score","Full funnel","DTI","Domains","Financials","Drop-off"],
    accentColor:"#92400E", bgColor:T.amberBg, borderColor:"rgba(245,158,11,0.3)", tagBg:T.amberBg,
  },
  {
    id:"exec_summary",
    category:"internal",
    icon:"",
    label:"Executive Summary",
    audience:"C-Level · Board · Investors",
    desc:"High-level board-ready summary: batch performance vs. previous period, revenue model projection, top verticals, quality rating and strategic recommendations.",
    tags:["Board-ready","Revenue projection","KPI summary","Top verticals","Strategic"],
    accentColor:T.navy, bgColor:T.surface2, borderColor:"#C7D2FE", tagBg:"#E0E7FF",
  },
  {
    id:"risk_screening",
    category:"internal",
    icon:"",
    label:"Risk Screening Report",
    audience:"Risk & Compliance team",
    desc:"High-risk lead identification: DTI >50%, single-name leads, unverified emails, inconsistent financial data. Flag before sending to regulated partners.",
    tags:["DTI >50%","Unverified emails","Single-name","Risk flags","Compliance"],
    accentColor:"#7F1D1D", bgColor:T.redBg, borderColor:"rgba(239,68,68,0.3)", tagBg:T.redBg,
    riskMode:true,
  },
  // ── VERTICALS ────────────────────────────────────────────────────────────────
  {
    id:"vertical_personal",
    category:"vertical",
    icon:"",
    label:"Personal Loans Batch",
    audience:"Consumer finance · BNPL · Neobanks",
    desc:"Personal expenses, lifestyle, education and general consumer credit leads. Employment mix, income profile, DTI and top purposes filtered to this vertical.",
    tags:["Personal expenses","Education","Lifestyle","Consumer credit","Employment mix"],
    accentColor:"#1E40AF", bgColor:T.surface3, borderColor:"rgba(59,130,246,0.3)", tagBg:T.surface3,
    vertical:"personal_loans",
  },
  {
    id:"vertical_reform",
    category:"vertical",
    icon:"",
    label:"Home Reform Batch",
    audience:"Reform financing · Home improvement lenders · Consumer banks",
    desc:"Home improvement leads. Unsecured personal credit — no appraisal needed. 83% request <€15k. 42% homeowners. Faster closing than mortgage. Different product entirely.",
    tags:["Home improvement","Unsecured","Avg €7.9k","42% homeowners","No appraisal"],
    accentColor:"#065F46", bgColor:T.greenBg, borderColor:"rgba(16,185,129,0.3)", tagBg:T.greenBg,
    vertical:"reform",
  },
  {
    id:"vertical_mortgage",
    category:"vertical",
    icon:"",
    label:"Mortgage / Refinance Batch",
    audience:"Mortgage brokers · Banks · Intermediarios hipotecarios",
    desc:"Refinancing leads. Secured product tied to property valuation. 82% have existing loans — confirmed refinance intent. Avg term 67 months. LCCI regulated.",
    tags:["Refinance","Secured product","Avg €14.9k","82% existing loans","LCCI"],
    accentColor:"#6D28D9", bgColor:T.surface3, borderColor:"rgba(139,92,246,0.3)", tagBg:T.surface3,
    vertical:"mortgage",
  },
  {
    id:"vertical_vehicle_unsecured",
    category:"vertical",
    icon:"",
    label:"Vehicle — Personal Credit Batch",
    audience:"Consumer finance · Cetelem · Cofidis · Bank personal loan desks",
    desc:"Vehicle purchase leads financed via unsecured personal credit (loan ≤€15k, term ≤60 months). Vehicle is the destination — underwriting is on income/DTI, not vehicle value. ~14 leads.",
    tags:["Unsecured","Loan ≤€15k","Term ≤60m","Income-based","Consumer credit"],
    accentColor:"#B45309", bgColor:T.amberBg, borderColor:"rgba(245,158,11,0.4)", tagBg:T.amberBg,
    vertical:"vehicle_unsecured",
  },
  {
    id:"vertical_vehicle_secured",
    category:"vertical",
    icon:"",
    label:"Vehicle — Secured Credit Batch",
    audience:"ALD Automotive · Arval · Specialized auto lenders · Dealers with secured financing",
    desc:"Vehicle-secured credit leads (loan >€15k or term >60 months). Vehicle is the collateral — partner must handle valuation (ITV/tasación) and registration (reserva de dominio). ~6 leads.",
    tags:["Vehicle as collateral","Loan >€15k","Notarial process","Tasación required","Auto lenders"],
    accentColor:"#DC2626", bgColor:T.redBg, borderColor:"rgba(239,68,68,0.3)", tagBg:T.redBg,
    vertical:"vehicle_secured",
  },
  // ── PARTNER-SPECIFIC ─────────────────────────────────────────────────────────
  {
    id:"partner_mortgage",
    category:"partner",
    icon:"",
    label:"Mortgage Partner Pack",
    audience:"Banks · Mortgage brokers · Hipotecas.com · iAhorro",
    desc:"Curated for mortgage brokers and banks. Refinancing leads with confirmed intent (82% existing loans), homeowner profile, avg loan €14.9k, LCCI compliance context. No internal data.",
    tags:["Refinance intent","Homeowners","Avg €14.9k","82% existing loans","LCCI context"],
    accentColor:"#6D28D9", bgColor:T.surface3, borderColor:"rgba(139,92,246,0.3)", tagBg:T.surface3,
    vertical:"mortgage", partnerFocus:"mortgage",
  },
  {
    id:"partner_auto",
    category:"partner",
    icon:"",
    label:"Auto Secured Credit — Partner Pack",
    audience:"ALD · Arval · LeasePlan · Specialized auto lenders",
    desc:"Vehicle-secured credit leads only (loan >€15k or term >60 months). Includes income, employment and loan profile. Clean external format — no internal ops data.",
    tags:["Secured only","Loan >€15k","Vehicle collateral","Tasación fit","Auto lenders"],
    accentColor:"#DC2626", bgColor:T.redBg, borderColor:"rgba(239,68,68,0.3)", tagBg:T.redBg,
    vertical:"vehicle_secured", partnerFocus:"auto",
  },
  {
    id:"partner_neobank",
    category:"partner",
    icon:"",
    label:"Neobank / BNPL Pack",
    audience:"Revolut · Cofidis · Vivus · WiZink",
    desc:"Personal loans vertical optimized for neobank and BNPL partners. Focus on digital-first profile, younger segment, income <€2k — high-volume plays.",
    tags:["Personal vertical","BNPL fit","Digital profile","High volume","Neobank"],
    accentColor:"#1E40AF", bgColor:T.surface3, borderColor:"rgba(59,130,246,0.3)", tagBg:T.surface3,
    vertical:"personal_loans", partnerFocus:"neobank",
  },
  // ── PREMIUM SEGMENTS ─────────────────────────────────────────────────────────
  {
    id:"premium_bc",
    category:"premium",
    icon:"",
    label:"Premium BC Segment",
    audience:"Tier-1 partners · Fintonic · Banks · Comparators",
    desc:"Bank Connected only, income >€2,000 and loan >€5,000. Highest conversion potential in the batch. Avg income €2.7k · Avg loan €15k.",
    tags:["BC only","Income >€2k","Loan >€5k","Avg ticket €15k","Top tier"],
    accentColor:"#005EFF", bgColor:T.surface3, borderColor:"#93C5FD", tagBg:T.surface3,
    premium:true,
  },
  {
    id:"retired_segment",
    category:"premium",
    icon:"",
    label:"Retired Segment",
    audience:"Consumer finance · Pension credit specialists",
    desc:"Retired profile leads. Stable pension income, avg €2,051/mo. Low DTI risk. Specific partner type: personal credit with pension collateral.",
    tags:["Retired","Stable income","Avg €2k/mo","Low DTI","Pension collateral"],
    accentColor:"#6D28D9", bgColor:T.surface3, borderColor:"rgba(139,92,246,0.3)", tagBg:T.surface3,
    segment:"retired",
  },
  // ── EXTERNAL GENERIC ─────────────────────────────────────────────────────────
  {
    id:"generic_partner",
    category:"external",
    icon:"",
    label:"Generic Partner Overview",
    audience:"Any new or prospective partner",
    desc:"Clean external overview: volume, quality badge, loan purposes and financial profile. Zero internal ops data. Safe to share with any external party.",
    tags:["Lead volume","Quality badge","Loan purpose","Avg income","BC rate"],
    accentColor:"#1E40AF", bgColor:T.surface3, borderColor:"rgba(59,130,246,0.2)", tagBg:T.surface3,
  },
];

export const getCategoryMeta = (T) => ({
  internal: { label:"Internal",  color:"#92400E", bg:T.amberBg,  border:"rgba(245,158,11,0.3)" },
  vertical: { label:"Vertical",  color:"#1E40AF", bg:T.surface3,  border:"rgba(59,130,246,0.2)" },
  partner:  { label:"Partner",   color:"#065F46", bg:T.greenBg,  border:"rgba(16,185,129,0.3)" },
  premium:  { label:"Premium",   color:"#005EFF", bg:T.surface3,  border:"rgba(59,130,246,0.3)" },
  external: { label:"External",  color:"#0C4A6E", bg:"#E0F2FE",  border:"#BAE6FD" },
});

export function buildReportData(data, opts={}) {
  const bcArr  = data["Bank Connected"]  || [];
  const fsArr  = data["Form Submitted"]  || [];
  const incArr = data["Incomplete"]      || [];

  let all = [...bcArr, ...fsArr, ...incArr];
  let bc  = bcArr, fs = fsArr;
  if (opts.vertical) {
    const vDef = VERTICALS_DEF[opts.vertical];
    const purps = vDef.purposes;
    all = all.filter(r => purps.includes(r.purpose));
    bc  = bc.filter(r  => purps.includes(r.purpose));
    fs  = fs.filter(r  => purps.includes(r.purpose));
    if (vDef.vehicleFilter === "unsecured") {
      const f = r => (r.loanAmount||0) <= 15000 && (r.loanMonths||0) <= 60;
      all = all.filter(f); bc = bc.filter(f); fs = fs.filter(f);
    } else if (vDef.vehicleFilter === "secured") {
      const f = r => (r.loanAmount||0) > 15000 || (r.loanMonths||0) > 60;
      all = all.filter(f); bc = bc.filter(f); fs = fs.filter(f);
    }
  }
  if (opts.segment === "retired") {
    all = all.filter(r => r.employment === "retired");
    bc  = bc.filter(r  => r.employment === "retired");
    fs  = fs.filter(r  => r.employment === "retired");
  }
  if (opts.premium) {
    bc  = bc.filter(r => (r.income||0)>2000 && (r.loanAmount||0)>5000);
    fs  = [];
    all = bc;
  }
  if (opts.riskMode) {
    const emailRe2 = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    all = [...bcArr,...fsArr,...incArr].filter(r => {
      const highDTI  = r.income&&r.expenses&&r.income>0 && (r.expenses/r.income)>0.5;
      const badEmail = !r.email || !emailRe2.test(r.email);
      const singleName = (r.name||"").trim().split(/\s+/).length<2;
      const unverified = !r.emailVerified;
      return highDTI || badEmail || singleName || unverified;
    });
    bc = all.filter(r => bcArr.includes(r));
    fs = all.filter(r => fsArr.includes(r));
  }

  const total      = all.length;
  const incomes    = all.map(r=>r.income).filter(Boolean);
  const loans      = all.map(r=>r.loanAmount).filter(Boolean);
  const ages       = all.map(r=>r.age).filter(Boolean);
  const avgIncome  = incomes.length ? Math.round(incomes.reduce((s,v)=>s+v,0)/incomes.length) : null;
  const avgLoan    = loans.length   ? Math.round(loans.reduce((s,v)=>s+v,0)/loans.length) : null;
  const avgAge     = ages.length    ? Math.round(ages.reduce((s,v)=>s+v,0)/ages.length) : null;

  const purposeCount={};
  all.forEach(r=>{if(r.purpose){const p=r.purpose.replace(/_/g," ");purposeCount[p]=(purposeCount[p]||0)+1;}});
  const topPurposes = Object.entries(purposeCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const empCount={};
  all.forEach(r=>{if(r.employment){const e=r.employment.replace(/_/g," ");empCount[e]=(empCount[e]||0)+1;}});
  const topEmp = Object.entries(empCount).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const resCount={};
  all.forEach(r=>{if(r.residential){const e=r.residential.replace(/_/g," ");resCount[e]=(resCount[e]||0)+1;}});
  const topRes = Object.entries(resCount).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const domainCount={};
  all.forEach(r=>{if(r.email){const d=r.email.split("@")[1]?.toLowerCase()||"?";domainCount[d]=(domainCount[d]||0)+1;}});
  const topDomains = Object.entries(domainCount).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const emailRe    = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const validEmails= all.filter(r=>r.email&&emailRe.test(r.email)).length;
  const fullNames  = all.filter(r=>(r.name||"").trim().split(/\s+/).length>=2).length;
  const emailVerif = all.filter(r=>r.emailVerified).length;
  const isEnriched = all.some(r=>r.income!=null);
  const hasAllFin  = all.filter(r=>r.income&&r.expenses&&r.loanAmount&&r.employment).length;

  const dti={h:0,m:0,hi:0};
  all.forEach(r=>{
    if(r.income&&r.expenses&&r.income>0){
      const ratio=r.expenses/r.income;
      if(ratio<0.3)dti.h++; else if(ratio<0.5)dti.m++; else dti.hi++;
    }
  });

  const delivScore = Math.round(
    (validEmails/Math.max(total,1))*40 +
    (fullNames/Math.max(total,1))*20 +
    (emailVerif/Math.max(total,1))*25 +
    (isEnriched?(hasAllFin/Math.max(total,1))*15:15)
  );
  const scoreColor  = delivScore>=80?"#00A651":delivScore>=60?"#F59E0B":"#EF4444";
  const scoreLabel  = delivScore>=80?"High Quality":delivScore>=60?"Standard":"Below Average";
  const bcRate      = (bc.length+fs.length)>0 ? ((bc.length/(bc.length+fs.length))*100).toFixed(1) : 0;

  const dates   = all.map(r=>r.created).filter(Boolean).sort();
  const dateFrom= dates[0]||"—", dateTo=dates[dates.length-1]||"—";
  const today   = new Date().toISOString().slice(0,10);
  const fmtK    = n => n>=1000?`€${(n/1000).toFixed(0)}k`:`€${n}`;
  const pct     = (n,d) => d>0?`${Math.round(n/d*100)}%`:"—";

  return {
    bcArr:bc, fsArr:fs, incArr, all, total,
    avgIncome, avgLoan, avgAge,
    topPurposes, topEmp, topRes, topDomains,
    validEmails, fullNames, emailVerif, isEnriched, hasAllFin,
    delivScore, scoreColor, scoreLabel,
    dti, bcRate, dateFrom, dateTo, today, fmtK, pct,
  };
}

export function downloadHTML(html, filename) {
  const a = Object.assign(document.createElement("a"),{
    href:"data:text/html;charset=utf-8,"+encodeURIComponent(html),
    download:filename
  });
  document.body.appendChild(a); a.click(); a.remove();
}

// ── Shared CSS for all reports ──────────────────────────────────────────────────
// Brand primary: #005eff (CreditChecker.io) · Navy: #0a1264
export const REPORT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'IBM Plex Sans',-apple-system,sans-serif;background:#F4F6FA;color:#0A1628;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.page{max-width:960px;margin:0 auto;padding:40px 48px;background:#fff;}
/* Header */
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #005EFF;margin-bottom:28px;}
.logo{display:flex;align-items:center;gap:12px;}
.logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#005EFF,#0A1264);border-radius:10px;display:flex;align-items:center;justify-content:center;}
.brand-name{font-size:19px;font-weight:900;letter-spacing:-0.5px;line-height:1;}
.brand-cc{color:#4D94FF;}
.brand-sub{font-size:9px;color:#9CA8BE;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;}
.header-right{text-align:right;}
.report-type{font-size:10px;color:#6B7A99;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.report-period{font-size:13px;font-weight:800;color:#0A1628;margin-top:4px;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:800;letter-spacing:0.5px;margin-top:8px;text-transform:uppercase;}
.badge-int{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;}
.badge-ext{background:#D1FAE5;color:#065F46;border:1px solid #86EFAC;}
.badge-prem{background:#EEF4FF;color:#005EFF;border:1px solid #A8C8FF;}
/* Section */
.section{margin-bottom:24px;}
.section-title{font-size:10px;font-weight:800;color:#6B7A99;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #E2E7F0;margin-bottom:14px;}
/* KPI grid */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.kpi-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.kpi{background:#F8F9FC;border-radius:10px;padding:16px;border-top:3px solid #0A1264;}
.kpi-b{border-top-color:#005EFF;} .kpi-b2{border-top-color:#1A6FFF;} .kpi-g{border-top-color:#059669;} .kpi-a{border-top-color:#D97706;} .kpi-p{border-top-color:#6D28D9;}
.kv{font-size:26px;font-weight:900;line-height:1;letter-spacing:-0.8px;color:#0A1628;}
.kpi-b .kv{color:#005EFF;} .kpi-b2 .kv{color:#1A6FFF;} .kpi-g .kv{color:#059669;} .kpi-a .kv{color:#D97706;} .kpi-p .kv{color:#6D28D9;}
.kl{font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:0.8px;text-transform:uppercase;margin-top:5px;}
.ks{font-size:10px;color:#9CA8BE;margin-top:2px;}
/* Two col */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
/* Bars */
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.bar-label{font-size:11px;color:#3D4F6E;width:155px;flex-shrink:0;text-transform:capitalize;}
.bar-track{flex:1;height:7px;background:#E2E7F0;border-radius:4px;overflow:hidden;}
.bar-fill{height:100%;border-radius:4px;}
.bar-val{font-size:11px;font-weight:700;color:#0A1628;width:55px;text-align:right;flex-shrink:0;}
/* Funnel */
.funnel{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #E2E7F0;border-radius:10px;overflow:hidden;}
.funnel-step{padding:16px;text-align:center;border-right:1px solid #E2E7F0;}
.funnel-step:last-child{border-right:none;}
.funnel-n{font-size:24px;font-weight:900;line-height:1;}
.funnel-pct{font-size:13px;font-weight:800;margin-top:3px;opacity:0.75;}
.funnel-label{font-size:9px;font-weight:700;color:#6B7A99;margin-top:5px;text-transform:uppercase;letter-spacing:0.8px;}
/* Score */
.score-box{display:flex;align-items:center;gap:22px;background:#F8F9FC;border-radius:10px;padding:18px 22px;}
.score-circle{width:84px;height:84px;border-radius:50%;border:7px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
.score-n{font-size:24px;font-weight:900;line-height:1;}
.score-max{font-size:10px;color:#9CA8BE;}
.score-row{display:flex;justify-content:space-between;margin-bottom:5px;font-size:11px;}
.score-bar-bg{height:4px;background:#E2E7F0;border-radius:3px;margin-top:2px;margin-bottom:6px;}
.score-bar{height:4px;border-radius:3px;}
/* Table */
.data-table{width:100%;border-collapse:collapse;font-size:12px;}
.data-table th{padding:7px 12px;text-align:left;font-size:9px;font-weight:800;color:#6B7A99;letter-spacing:1.2px;text-transform:uppercase;background:#F8F9FC;border-bottom:2px solid #E2E7F0;}
.data-table td{padding:9px 12px;border-bottom:1px solid #F4F6FA;}
/* Highlight box */
.hi-box{background:#F0F7FF;border:1px solid #BAD4FF;border-radius:9px;padding:14px 18px;}
/* Internal banner */
.int-banner{background:#FEF9EC;border:1px solid #FDE68A;border-radius:8px;padding:10px 16px;margin-bottom:24px;font-size:12px;display:flex;align-items:center;gap:8px;color:#78350F;}
/* Footer */
.footer{margin-top:36px;padding-top:14px;border-top:1px solid #E2E7F0;display:flex;justify-content:space-between;font-size:10px;color:#9CA8BE;}
/* No print */
.no-print{margin-bottom:20px;}
.btn-print{padding:9px 20px;background:#005EFF;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;}
@media print{.no-print{display:none!important;} body{background:#fff;} .page{padding:24px 32px;}}
`;

function makeHeader(reportLabel, dateFrom, dateTo, today, badgeHTML="") {
  return `
  <div class="header">
    <div class="logo">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L14.5 5V13L9 16L3.5 13V5L9 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M6.5 9.5L8 11L11.5 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <div class="brand-name">CREDIT<span class="brand-cc">CHECK</span></div>
        <div class="brand-sub">Lead Intelligence</div>
      </div>
    </div>
    <div class="header-right">
      <div class="report-type">${reportLabel}</div>
      <div class="report-period">${dateFrom} → ${dateTo}</div>
      ${badgeHTML}
    </div>
  </div>`;
}

function makePrintBtn() {
  return `<div class="no-print"><button class="btn-print" onclick="window.print()">Print / Save as PDF</button></div>`;
}

function makeKPIGrid(items) {
  return `<div class="kpi-grid">${items.map(([cls,val,label,sub])=>`
    <div class="kpi ${cls}"><div class="kv">${val}</div><div class="kl">${label}</div><div class="ks">${sub}</div></div>`).join("")}
  </div>`;
}

function makeFunnel(steps, total) {
  const pct = (n,d) => d>0?`${Math.round(n/d*100)}%`:"—";
  return `<div class="funnel">${steps.map(([label,n,color])=>`
    <div class="funnel-step" style="background:${color}0D">
      <div class="funnel-n" style="color:${color}">${n}</div>
      <div class="funnel-pct" style="color:${color}">${pct(n,total)}</div>
      <div class="funnel-label">${label}</div>
    </div>`).join("")}</div>`;
}

function makeBars(items, total, color="#005EFF") {
  return items.map(([label,count])=>{
    const p = total>0?Math.round(count/total*100):0;
    return `<div class="bar-row">
      <div class="bar-label">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${color}"></div></div>
      <div class="bar-val">${count} (${p}%)</div>
    </div>`;
  }).join("");
}

export function makeReport(reportDef, data) {
  const opts = {};
  if (reportDef.vertical) opts.vertical = reportDef.vertical;
  if (reportDef.segment)  opts.segment  = reportDef.segment;
  if (reportDef.premium)  opts.premium  = true;
  if (reportDef.riskMode) opts.riskMode = true;

  const d = buildReportData(data, opts);
  const { bcArr,fsArr,all,total,avgIncome,avgLoan,avgAge,topPurposes,topEmp,topRes,topDomains,
          validEmails,fullNames,emailVerif,isEnriched,delivScore,scoreColor,scoreLabel,
          dti,bcRate,dateFrom,dateTo,today,fmtK,pct } = d;

  const isInternal  = reportDef.category === "internal";
  const isPremium   = reportDef.category === "premium";
  const isExternal  = reportDef.category === "external";
  const isVertical  = reportDef.category === "vertical";
  const isSegment   = reportDef.category === "segment";
  const isPartner   = reportDef.category === "partner";
  const isRisk      = reportDef.id === "risk_screening";
  const isExec      = reportDef.id === "exec_summary";

  const badgeHTML = isInternal ? `<span class="badge badge-int">Internal</span>` :
                    isPremium  ? `<span class="badge badge-prem">Premium</span>` :
                    isRisk     ? `<span class="badge badge-int" style="background:#FEE2E2;color:#7F1D1D;border-color:#FECACA">Risk &amp; Compliance</span>` :
                                 `<span class="badge badge-ext">Partner Distribution</span>`;

  const intBanner = isRisk
    ? `<div class="int-banner" style="background:#FEF2F2;border-color:#FECACA;color:#7F1D1D;"><strong>Risk & Compliance — Internal only.</strong> Contains flagged leads with high-risk indicators. Do not share externally.</div>`
    : isInternal
    ? `<div class="int-banner"><strong>Internal use only — Ops & Management.</strong> Not for distribution to leads, partners or external stakeholders.</div>`
    : "";

  const kpiItems = isPremium && reportDef.id==="premium_bc"
    ? [["kpi-b",bcArr.length,"Bank Connected","Open Banking verified"],
       ["kpi-g",avgIncome?fmtK(avgIncome):"—","Avg Monthly Income","Filtered: >€2k"],
       ["kpi-a",avgLoan?fmtK(avgLoan):"—","Avg Loan Request","Filtered: >€5k"],
       ["",`${bcRate}%`,"BC Rate (of active)","BC / (BC+FS)"]]
    : isSegment || (isPremium && reportDef.id!=="premium_bc")
    ? [["",total,"Total Leads",`${reportDef.label}`],
       ["kpi-b",bcArr.length,"Bank Connected",`${bcRate}% BC rate`],
       ["kpi-b2",fsArr.length,"Form Submitted","Pending OB"],
       ["",avgIncome?fmtK(avgIncome):"—","Avg Income","Segment avg"]]
    : isRisk
    ? [["kpi-a",total,"Flagged Leads","Require review"],
       ["kpi-b",dti.hi,"High DTI >50%","Risk: overextended"],
       ["",all.filter(r=>!r.emailVerified).length,"Unverified Email","Deliverability risk"],
       ["",all.filter(r=>(r.name||"").trim().split(/\s+/).length<2).length,"Single Name","Data quality issue"]]
    : [["",total,"Total Leads","Unique · validated"],
       ["kpi-b",bcArr.length,"Bank Connected","Open Banking verified"],
       ["kpi-b2",fsArr.length,"Form Submitted","Pending bank connection"],
       ["kpi-g",`${bcRate}%`,"BC Rate","Verification rate"]];

  // Static hex replaces T.navy (#0A1264) — reports are always light-mode HTML
  const funnelSteps = isInternal
    ? [["Total Entries",total,"#0A1264"],["Form Completed",bcArr.length+fsArr.length,"#005EFF"],["Bank Connected",bcArr.length,"#1A6FFF"],["Email Verified",emailVerif,"#00A651"]]
    : [["Total Leads",total,"#0A1264"],["Form Completed",bcArr.length+fsArr.length,"#005EFF"],["Bank Connected",bcArr.length,"#1A6FFF"],["Email Verified",emailVerif,"#00A651"]];

  const dtiSection = isInternal && (dti.h+dti.m+dti.hi)>0 ? `
  <div class="section">
    <div class="section-title">Debt-to-Income Analysis</div>
    <div class="two-col">
      <div>
        ${[["Healthy <30%",dti.h,"#00A651"],["Moderate 30–50%",dti.m,"#F59E0B"],["High >50%",dti.hi,"#EF4444"]].map(([label,n,color])=>`
        <div class="bar-row">
          <div class="bar-label">${label}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${total>0?Math.round(n/total*100):0}%;background:${color}"></div></div>
          <div class="bar-val">${n} (${total>0?Math.round(n/total*100):0}%)</div>
        </div>`).join("")}
      </div>
      <div>
        <div style="font-size:11px;color:#3D4F6E;line-height:1.8;padding:12px 16px;background:#F8F9FC;border-radius:8px;">
          <strong>DTI Interpretation:</strong><br/>
          ${Math.round(dti.h/Math.max(total,1)*100)}% of leads have healthy DTI (<30%) — strong creditworthiness signal.<br/>
          ${Math.round(dti.hi/Math.max(total,1)*100)}% are high-risk (>50%) — flag for risk-adjusted pricing.
        </div>
      </div>
    </div>
  </div>` : "";

  const qualitySection = isInternal ? `
  <div class="section">
    <div class="section-title">Data Quality & Deliverability Score</div>
    <div class="score-box">
      <div class="score-circle" style="border-color:${scoreColor}">
        <div class="score-n" style="color:${scoreColor}">${delivScore}</div>
        <div class="score-max">/100</div>
      </div>
      <div style="flex:1">
        ${[["Valid email format",Math.round(validEmails/Math.max(total,1)*100)],
           ["Email verified",Math.round(emailVerif/Math.max(total,1)*100)],
           ["Full name provided",Math.round(fullNames/Math.max(total,1)*100)],
           ["Financial data complete",isEnriched?Math.round(d.hasAllFin/Math.max(total,1)*100):100]
          ].map(([label,p])=>`
          <div class="score-row"><span style="color:#3D4F6E">${label}</span><span style="font-weight:800;color:${p>=80?"#00A651":p>=60?"#F59E0B":"#EF4444"}">${p}%</span></div>
          <div class="score-bar-bg"><div class="score-bar" style="width:${p}%;background:${p>=80?"#00A651":p>=60?"#F59E0B":"#EF4444"}"></div></div>`
        ).join("")}
      </div>
    </div>
  </div>` : !isExternal ? `` : `
  <div class="section">
    <div class="section-title">Batch Quality</div>
    <div class="score-box">
      <div class="score-circle" style="border-color:${scoreColor}">
        <div class="score-n" style="color:${scoreColor}">${delivScore}</div><div class="score-max">/100</div>
      </div>
      <div style="flex:1;border-left:1px solid #E2E7F0;padding-left:22px;">
        <div style="font-size:14px;font-weight:900;color:${scoreColor};margin-bottom:4px;">${scoreLabel}</div>
        <div style="font-size:12px;color:#3D4F6E;line-height:1.9;">
          ✓ All leads email-validated<br/>
          ✓ Deduplicated — one record per person<br/>
          ✓ Test emails filtered<br/>
          ${emailVerif>0?`✓ ${pct(emailVerif,total)} email-verified`:``}
        </div>
      </div>
    </div>
  </div>`;

  const domainSection = isInternal && topDomains.length>0 ? `
  <div>
    <div class="section-title">Email Domain Breakdown</div>
    ${makeBars(topDomains,total,"#005EFF")}
  </div>` : "";

  const residSection = (isInternal||isVertical||isSegment) && topRes.length>0 ? `
  <div class="section">
    <div class="section-title">Residential Status</div>
    ${makeBars(topRes.map(([l,c])=>[l,c]),total,reportDef.vertical==="mortgage"?"#6D28D9":reportDef.vertical==="reform"?"#00A651":"#1A6FFF")}
  </div>` : "";

  // Static hex #0A1264 replaces T.navy for employment bar color in HTML reports
  const finSection = (avgIncome||avgLoan||avgAge) ? `
  <div class="section">
    <div class="section-title">Lead Financial Profile</div>
    <div class="two-col">
      <div class="hi-box">
        ${avgIncome?`<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase">Avg Monthly Net Income</div><div style="font-size:26px;font-weight:900;color:#005EFF;margin-top:3px">${fmtK(avgIncome)}</div></div>`:""}
        ${avgLoan?`<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase">Avg Loan Request</div><div style="font-size:26px;font-weight:900;color:#1A6FFF;margin-top:3px">${fmtK(avgLoan)}</div></div>`:""}
        ${avgAge?`<div><div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase">Average Age</div><div style="font-size:26px;font-weight:900;color:#0A1628;margin-top:3px">${avgAge} yrs</div></div>`:""}
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Employment</div>
        ${makeBars(topEmp.slice(0,3).map(([l,c])=>[l,c]),total,"#0A1264")}
      </div>
    </div>
  </div>` : "";

  const purposeSection = topPurposes.length>0 ? `
  <div class="section">
    <div class="section-title">Loan Purpose Breakdown</div>
    ${makeBars(topPurposes.map(([l,c])=>[l,c]),Math.max(bcArr.length+fsArr.length,1),"#005EFF")}
  </div>` : "";

  const totalAll = (data["Bank Connected"]||[]).length + (data["Form Submitted"]||[]).length + (data["Incomplete"]||[]).length;
  const execSection = isExec ? `
  <div class="section">
    <div class="section-title">Strategic Overview</div>
    <div style="background:#F0F4FF;border-radius:10px;padding:18px 22px;border-left:4px solid #005EFF;font-size:12px;color:#1E3A5F;line-height:1.8;">
      <strong style="font-size:13px;color:#0A1628;display:block;margin-bottom:8px;">Batch Performance Summary</strong>
      Total pipeline: <strong>${totalAll} leads</strong> processed · ${bcArr.length} Bank Connected (${bcRate}% BC rate)<br/>
      Estimated revenue potential: CPL model → <strong>€${(bcArr.length*10+fsArr.length*5).toLocaleString()}</strong> · CPA model → <strong>€${Math.round(bcArr.length*0.35*avgLoan*0.01||0).toLocaleString()}</strong><br/>
      Data quality score: <strong>${delivScore}/100</strong> (${scoreLabel}) · ${Math.round(emailVerif/Math.max(total,1)*100)}% email verified<br/>
      Top vertical: Personal Loans · Second: Home & Reform · Third: Vehicle
    </div>
  </div>
  <div class="section">
    <div class="section-title">Revenue Model Projection</div>
    <table class="data-table">
      <tr><th>Model</th><th>Volume</th><th>Rate</th><th>Estimated Revenue</th></tr>
      <tr><td>CPL — BC leads</td><td>${bcArr.length} BC</td><td>€10/lead</td><td><strong>€${(bcArr.length*10).toLocaleString()}</strong></td></tr>
      <tr><td>CPL — FS leads</td><td>${fsArr.length} FS</td><td>€5/lead</td><td><strong>€${(fsArr.length*5).toLocaleString()}</strong></td></tr>
      <tr><td>CPA — BC × 35% conv × 1% ticket</td><td>${bcArr.length} BC</td><td>35% · €${avgLoan?fmtK(avgLoan):"—"}</td><td><strong>€${Math.round(bcArr.length*0.35*(avgLoan||0)*0.01).toLocaleString()}</strong></td></tr>
      <tr><td><strong>Hybrid (CPL + CPA)</strong></td><td>All BC+FS</td><td>Combined</td><td><strong>€${Math.round(bcArr.length*10+fsArr.length*5+bcArr.length*0.35*(avgLoan||0)*0.01).toLocaleString()}</strong></td></tr>
    </table>
  </div>` : "";

  const riskSection = isRisk ? `
  <div class="section">
    <div class="section-title">Risk Flag Detail</div>
    <table class="data-table">
      <tr><th>Risk Type</th><th>Count</th><th>% of Batch</th><th>Action</th></tr>
      <tr><td>DTI Ratio >50%</td><td><strong>${dti.hi}</strong></td><td>${pct(dti.hi,total)}</td><td>Flag for risk-adjusted pricing or exclude</td></tr>
      <tr><td>Email Unverified</td><td><strong>${total-emailVerif}</strong></td><td>${pct(total-emailVerif,total)}</td><td>Run email verification before sending to partner</td></tr>
      <tr><td>Single Name Only</td><td><strong>${total-fullNames}</strong></td><td>${pct(total-fullNames,total)}</td><td>Request additional identity verification</td></tr>
      <tr><td>DTI Moderate 30–50%</td><td><strong>${dti.m}</strong></td><td>${pct(dti.m,total)}</td><td>Acceptable — flag for partner awareness</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Compliance Recommendations</div>
    <div style="background:#FEF2F2;border-radius:10px;padding:16px 20px;border-left:4px solid #EF4444;font-size:12px;color:#7F1D1D;line-height:1.8;">
      <strong>Before sharing this batch with regulated partners:</strong><br/>
      1. Exclude or flag leads with DTI >50% — ${dti.hi} leads (${pct(dti.hi,total)})<br/>
      2. Run email verification on unverified leads — ${total-emailVerif} pending<br/>
      3. Collect surname for single-name leads if sending to KYC-required partners<br/>
      4. Confirm GDPR consent status for all leads before transmission
    </div>
  </div>` : "";

  // M-06: No-cache and no-index meta tags prevent the report from being stored
  // in browser history, print queues, or indexed by search engines.
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate"/>
<meta http-equiv="Pragma" content="no-cache"/>
<meta name="robots" content="noindex, nofollow"/>
<title>CreditCheck — ${reportDef.label} — ${today} [CONFIDENTIAL]</title>
<style>${REPORT_CSS}</style>
</head><body><div class="page">
  ${intBanner}
  ${makeHeader(reportDef.label, dateFrom, dateTo, today, badgeHTML)}
  ${makePrintBtn()}
  ${execSection}
  <div class="section">
    <div class="section-title">${isRisk?"Flagged Leads Overview":"Summary"}</div>
    ${makeKPIGrid(kpiItems)}
  </div>
  ${riskSection}
  ${qualitySection}
  ${finSection}
  <div class="section">
    <div class="section-title">Verification Funnel</div>
    ${makeFunnel(funnelSteps, total)}
  </div>
  ${purposeSection}
  ${dtiSection}
  ${opts.vertical==="mortgage" ? `
  <div class="section">
    <div class="section-title">Regulatory Context</div>
    <div style="background:#FEF9EC;border:1px solid #FDE68A;border-radius:10px;padding:18px 22px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px;">
        <div><div style="font-size:9px;font-weight:800;color:#92400E;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Regulatory framework</div>
          <div style="color:#78350F;line-height:1.7;">LCCI — Ley 5/2019<br/>Mandatory compliance<br/>for all mortgage intermediaries</div></div>
        <div><div style="font-size:9px;font-weight:800;color:#92400E;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Partner requirements</div>
          <div style="color:#78350F;line-height:1.7;">BDER registration required<br/>for intermediarios hipotecarios<br/>Mandatory cooling-off (10 days)</div></div>
        <div><div style="font-size:9px;font-weight:800;color:#92400E;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Lead suitability note</div>
          <div style="color:#78350F;line-height:1.7;">These leads express refinance intent<br/>Product fit depends on property<br/>valuation and current LTV</div></div>
      </div>
    </div>
  </div>` : ""}
  ${opts.vertical==="vehicle_secured" ? `
  <div class="section">
    <div class="section-title">Product & Heuristic Note</div>
    <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:10px;padding:18px 22px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px;">
        <div><div style="font-size:9px;font-weight:800;color:#9F1239;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Segmentation method</div>
          <div style="color:#881337;line-height:1.7;">No explicit field in source data.<br/>Leads classified as vehicle-secured<br/>based on: loan &gt;€15k OR term &gt;60 months.<br/>These amounts are not viable as unsecured personal credit at these income levels.</div></div>
        <div><div style="font-size:9px;font-weight:800;color:#9F1239;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Partner capability required</div>
          <div style="color:#881337;line-height:1.7;">Vehicle valuation (ITV / tasación)<br/>Collateral registration capability<br/>Reserva de dominio or<br/>Prenda sin desplazamiento (notarial)</div></div>
      </div>
    </div>
  </div>` : ""}
  ${opts.vertical==="vehicle_unsecured" ? `
  <div class="section">
    <div class="section-title">Product Classification Note</div>
    <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:14px 20px;font-size:12px;color:#78350F;line-height:1.7;">
      <strong>Segmentation based on heuristic — no explicit field in source data.</strong>
      Leads classified as unsecured personal credit (loan ≤€15k AND term ≤60 months).
      The vehicle is the stated purchase destination, not the collateral.
      Underwriting should be based on income and DTI — no vehicle valuation required from the partner.
    </div>
  </div>` : ""}
  ${isInternal||isVertical||isSegment||isPartner||isPremium ? `<div class="section"><div class="two-col">${domainSection}${residSection}</div></div>` : ""}
  <div class="footer">
    <span>CreditCheck by Clovr Labs · ${today}</span>
    <span>${isInternal||isRisk?"Internal — Confidential":isPremium?"Premium Segment — Partner Distribution":"Lead Batch Report — Partner Distribution"}</span>
  </div>
</div></body></html>`;

  return html;
}
