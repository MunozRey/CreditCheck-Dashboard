import { getVerticalsDef } from '../constants/verticals.js';
import { THEMES } from '../constants/themes.js';

// Reports are always light-mode static HTML — use light theme for vertical lookups
const VERTICALS_DEF = getVerticalsDef(THEMES.light);

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

// Full CreditCheck wordmark SVG — paths extracted from CreditCheckerLogo.jsx
// Color param: pass hex string. Icon mark uses #005EFF, wordmark uses navy color.
function makeLogoSVG(navyColor = "#0A1264") {
  return `<svg width="155" height="39" viewBox="0 0 193 48.3344" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#cc-rpt-clip)">
    <path d="M140.071 17.9883V20.1167H137.573V17.8523C137.573 15.7239 136.729 14.4441 134.807 14.4441C132.884 14.4441 132.041 15.7286 132.041 17.8523V30.3414C132.041 32.4698 132.917 33.7497 134.807 33.7497C136.696 33.7497 137.573 32.4651 137.573 30.3414V27.2707H140.071V30.2055C140.071 33.7825 138.384 36.1453 134.736 36.1453C131.089 36.1453 129.434 33.7825 129.434 30.2055V17.9836C129.434 14.4066 131.122 12.0437 134.736 12.0437C138.351 12.0437 140.071 14.4066 140.071 17.9836V17.9883Z" fill="${navyColor}"/>
    <path d="M145.102 25.283V35.9156H142.467V12.2828H145.102V22.9155H150.91V12.2828H153.545V35.9109H150.91V25.2783H145.102V25.283Z" fill="${navyColor}"/>
    <path d="M164.646 22.7514V25.1142H158.875V33.52H165.964V35.9156H156.241V12.2828H165.964V14.6785H158.875V22.7467H164.646V22.7514Z" fill="${navyColor}"/>
    <path d="M178.823 17.9883V20.1167H176.324V17.8523C176.324 15.7239 175.481 14.4441 173.558 14.4441C171.636 14.4441 170.792 15.7286 170.792 17.8523V30.3414C170.792 32.4698 171.669 33.7497 173.558 33.7497C175.448 33.7497 176.324 32.4651 176.324 30.3414V27.2707H178.823V30.2055C178.823 33.7825 177.135 36.1453 173.488 36.1453C169.841 36.1453 168.186 33.7825 168.186 30.2055V17.9836C168.186 14.4066 169.874 12.0438 173.488 12.0438C177.103 12.0438 178.823 14.4066 178.823 17.9836V17.9883Z" fill="${navyColor}"/>
    <path d="M185.236 25.6533L183.854 27.9833V35.9156H181.219V12.2828H183.854V23.6937L190.131 12.2828H192.798L186.821 23.0514L193 35.9109H190.3L185.236 25.6486V25.6533Z" fill="${navyColor}"/>
    <path d="M66.9884 27.0691V30.2102C66.9884 33.9888 65.0991 36.15 61.4517 36.15C57.8044 36.15 55.9151 33.9888 55.9151 30.2102V17.9226C55.9151 14.1393 57.8044 11.9828 61.4517 11.9828C65.0991 11.9828 66.9884 14.144 66.9884 17.9226V20.2198H63.477V17.6882C63.477 16.0005 62.7363 15.3582 61.5549 15.3582C60.3734 15.3582 59.6327 16.0005 59.6327 17.6882V30.4493C59.6327 32.137 60.3734 32.7464 61.5549 32.7464C62.7363 32.7464 63.477 32.137 63.477 30.4493V27.0738H66.9884V27.0691Z" fill="${navyColor}"/>
    <path d="M77.0162 35.8828C76.8146 35.2733 76.6787 34.903 76.6787 32.9808V29.2679C76.6787 27.0738 75.938 26.2628 74.2502 26.2628H72.9657V35.8828H69.2527V12.25H74.855C78.7039 12.25 80.3589 14.0409 80.3589 17.6835V19.54C80.3589 21.9685 79.5806 23.5577 77.9304 24.3313C79.7869 25.1095 80.3964 26.8957 80.3964 29.3616V33.009C80.3964 34.1575 80.4292 35.0014 80.7995 35.8781H77.0209L77.0162 35.8828ZM72.961 15.6255V22.8826H74.4143C75.7973 22.8826 76.6412 22.2732 76.6412 20.3839V18.0539C76.6412 16.3662 76.0692 15.6255 74.7519 15.6255H72.961Z" fill="${navyColor}"/>
    <path d="M86.5331 22.2076H91.6291V25.583H86.5331V32.5026H92.9464V35.8781H82.8201V12.25H92.9464V15.6255H86.5331V22.2076Z" fill="${navyColor}"/>
    <path d="M95.2389 12.25H101.113C104.826 12.25 106.65 14.3081 106.65 18.0914V30.0414C106.65 33.82 104.826 35.8828 101.113 35.8828H95.2389V12.25ZM98.9519 15.6255V32.5026H101.043C102.224 32.5026 102.932 31.8932 102.932 30.2055V17.9179C102.932 16.2302 102.224 15.6208 101.043 15.6208H98.9519V15.6255Z" fill="${navyColor}"/>
    <path d="M109.013 12.25H112.726V35.8781H109.013V12.25Z" fill="${navyColor}"/>
    <path d="M114.348 12.25H125.824V15.6255H121.942V35.8781H118.229V15.6255H114.348V12.25Z" fill="${navyColor}"/>
    <path d="M43.8338 24.4204V14.6363L21.9028 27.0223L10.6139 20.5058V30.3789L21.9028 36.8954L43.8338 24.4204Z" fill="#005EFF"/>
    <path d="M8.26045 31.7994V16.535L20.7402 9.48873V0L0 11.7109V36.6235L20.7402 48.3344V38.8457L8.26045 31.7994Z" fill="#005EFF"/>
    <path d="M35.5734 16.535L43.8338 11.7109L23.0936 0V9.48873L35.5734 16.535Z" fill="#005EFF"/>
    <path d="M35.5734 31.7994L23.0936 38.8457V48.3344L43.8338 36.6235L35.5734 31.7994Z" fill="#005EFF"/>
  </g>
  <defs><clipPath id="cc-rpt-clip"><rect width="193" height="48.3344" fill="white"/></clipPath></defs>
</svg>`;
}

// ── Shared CSS for all reports ──────────────────────────────────────────────────
// Brand primary: #005eff (CreditChecker.io) · Navy: #0a1264
export const REPORT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'IBM Plex Sans',-apple-system,sans-serif;background:#F4F6FA;color:#0A1628;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.page{max-width:960px;margin:0 auto;padding:40px 48px;background:#fff;}
/* Header */
.header{display:flex;justify-content:space-between;align-items:center;padding-bottom:24px;border-bottom:3px solid #005EFF;margin-bottom:32px;}
.logo{display:flex;align-items:center;}
.header-right{text-align:right;}
.report-type{font-size:10px;color:#6B7A99;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.report-period{font-size:13px;font-weight:800;color:#0A1628;margin-top:4px;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:800;letter-spacing:0.5px;margin-top:8px;text-transform:uppercase;}
.badge-int{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;}
.badge-ext{background:#D1FAE5;color:#065F46;border:1px solid #86EFAC;}
.badge-prem{background:#EEF4FF;color:#005EFF;border:1px solid #A8C8FF;}
/* Cover intro */
.cover-intro{background:linear-gradient(135deg,#0A1264,#005EFF);border-radius:14px;padding:28px 32px;margin-bottom:32px;color:#fff;}
.cover-title{font-size:22px;font-weight:900;letter-spacing:-0.5px;margin-bottom:6px;}
.cover-sub{font-size:12px;opacity:0.8;line-height:1.7;}
.cover-meta{display:flex;gap:32px;margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.2);}
.cover-meta-item{font-size:10px;opacity:0.7;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;}
.cover-meta-val{font-size:14px;font-weight:800;opacity:1;margin-top:2px;}
/* Section */
.section{margin-bottom:28px;}
.section-title{font-size:10px;font-weight:800;color:#6B7A99;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #E2E7F0;margin-bottom:16px;}
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
/* Leads table */
.data-table{width:100%;border-collapse:collapse;font-size:11px;}
.data-table th{padding:7px 10px;text-align:left;font-size:9px;font-weight:800;color:#6B7A99;letter-spacing:1.2px;text-transform:uppercase;background:#F8F9FC;border-bottom:2px solid #E2E7F0;}
.data-table td{padding:8px 10px;border-bottom:1px solid #F4F6FA;color:#1E2D47;vertical-align:middle;}
.data-table tr:hover td{background:#FAFBFF;}
.cat-bc{display:inline-block;padding:2px 7px;border-radius:20px;font-size:8px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;background:#D1FAE5;color:#065F46;border:1px solid #86EFAC;}
.cat-fs{display:inline-block;padding:2px 7px;border-radius:20px;font-size:8px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;background:#EEF4FF;color:#1E40AF;border:1px solid #BFDBFE;}
/* Highlight box */
.hi-box{background:#F0F7FF;border:1px solid #BAD4FF;border-radius:9px;padding:14px 18px;}
/* Internal banner */
.int-banner{background:#FEF9EC;border:1px solid #FDE68A;border-radius:8px;padding:10px 16px;margin-bottom:24px;font-size:12px;display:flex;align-items:center;gap:8px;color:#78350F;}
/* Footer */
.footer{margin-top:40px;padding-top:16px;border-top:2px solid #E2E7F0;}
.footer-main{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}
.footer-brand{display:flex;align-items:center;gap:10px;}
.footer-info{font-size:10px;color:#6B7A99;line-height:1.7;}
.footer-info strong{color:#0A1628;}
.footer-legal{font-size:9px;color:#B0BAD0;margin-top:10px;line-height:1.6;border-top:1px solid #F0F2F8;padding-top:10px;}
/* No print */
.no-print{margin-bottom:24px;}
.btn-print{padding:9px 20px;background:#005EFF;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;}
@media print{.no-print{display:none!important;} body{background:#fff;} .page{padding:24px 32px;}}
`;

function makeHeader(reportLabel, dateFrom, dateTo, today, badgeHTML="") {
  return `
  <div class="header">
    <div class="logo">${makeLogoSVG()}</div>
    <div class="header-right">
      <div class="report-type">${reportLabel}</div>
      <div class="report-period">${dateFrom} → ${dateTo}</div>
      ${badgeHTML}
    </div>
  </div>`;
}

function makeCoverIntro(reportDef, d) {
  const isExternal = reportDef.category === "external" || reportDef.category === "partner";
  return `
  <div class="cover-intro">
    <div class="cover-title">${reportDef.label}</div>
    <div class="cover-sub">Prepared by CreditCheck · Clovr Labs · creditchecker.io<br/>
    ${isExternal ? "This document is intended exclusively for the named partner. All lead data has been sourced, validated and deduplicated by CreditCheck." : "Internal use only — not for external distribution."}</div>
    <div class="cover-meta">
      <div><div class="cover-meta-item">Total Leads</div><div class="cover-meta-val">${d.total}</div></div>
      <div><div class="cover-meta-item">Bank Connected</div><div class="cover-meta-val">${d.bcArr.length}</div></div>
      <div><div class="cover-meta-item">BC Rate</div><div class="cover-meta-val">${d.bcRate}%</div></div>
      <div><div class="cover-meta-item">Batch Period</div><div class="cover-meta-val">${d.dateFrom} → ${d.dateTo}</div></div>
    </div>
  </div>`;
}

function makeLeadsTable(leads, showEmail = true) {
  if (!leads || leads.length === 0) return "";
  const fmtEur = n => n >= 1000 ? `€${(n/1000).toFixed(0)}k` : `€${n}`;
  const maskEmail = e => {
    if (!e) return "—";
    const [local, domain] = e.split("@");
    return local.length <= 2 ? `${local[0]}***@${domain}` : `${local[0]}${local[1]}***@${domain}`;
  };
  const fmtEmp = e => (e || "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const fmtPurpose = p => (p || "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const rows = leads.slice(0, 200).map(r => {
    const catBadge = r.category === "Bank Connected"
      ? `<span class="cat-bc">BC</span>`
      : `<span class="cat-fs">FS</span>`;
    return `<tr>
      <td>${catBadge}</td>
      <td style="font-weight:600">${r.name || "—"}</td>
      ${showEmail ? `<td style="font-family:'IBM Plex Mono',monospace;font-size:10px">${maskEmail(r.email)}</td>` : ""}
      <td>${r.country || "—"}</td>
      <td>${fmtPurpose(r.purpose)}</td>
      <td style="font-weight:700;color:#005EFF">${r.loanAmount ? fmtEur(r.loanAmount) : "—"}</td>
      <td>${r.income ? fmtEur(r.income) + "/mo" : "—"}</td>
      <td style="text-transform:capitalize">${fmtEmp(r.employment)}</td>
    </tr>`;
  }).join("");

  return `
  <div class="section">
    <div class="section-title">Lead Details (${Math.min(leads.length, 200)} leads${leads.length > 200 ? ` · showing first 200 of ${leads.length}` : ""})</div>
    <table class="data-table">
      <thead><tr>
        <th>Grade</th>
        <th>Name</th>
        ${showEmail ? "<th>Email</th>" : ""}
        <th>Country</th>
        <th>Purpose</th>
        <th>Loan</th>
        <th>Income</th>
        <th>Employment</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

function makeFooter(today, isInternal, isPremium) {
  return `
  <div class="footer">
    <div class="footer-main">
      <div class="footer-brand">
        ${makeLogoSVG()}
      </div>
      <div class="footer-info" style="text-align:right">
        <strong>Clovr Labs S.L.</strong><br/>
        creditchecker.io &nbsp;·&nbsp; hello@creditchecker.io<br/>
        ${isInternal || isPremium ? "Internal — Confidential" : "Lead Batch Report — Partner Distribution"}
        &nbsp;·&nbsp; Generated ${today}
      </div>
    </div>
    <div class="footer-legal">
      This report and all data contained herein are confidential and proprietary to Clovr Labs S.L. and CreditCheck.
      All personal data has been collected with explicit GDPR consent. Recipient agrees to use this data solely for
      the purpose of evaluating and activating the described lead batch, in compliance with applicable data protection laws.
      Redistribution or resale of this data without written authorization is strictly prohibited.
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

  // Leads table for partner/external/vertical/premium reports
  const leadsForTable = (isPartner || isExternal || isVertical || isPremium) ? all : [];
  const leadsTableSection = leadsForTable.length > 0 ? makeLeadsTable(leadsForTable) : "";

  // M-06: No-cache and no-index meta tags prevent the report from being stored
  // in browser history, print queues, or indexed by search engines.
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate"/>
<meta http-equiv="Pragma" content="no-cache"/>
<meta name="robots" content="noindex, nofollow"/>
<title>CreditCheck — ${reportDef.label} — ${today}</title>
<style>${REPORT_CSS}</style>
</head><body><div class="page">
  ${makeHeader(reportDef.label, dateFrom, dateTo, today, badgeHTML)}
  ${makePrintBtn()}
  ${isPartner || isExternal ? makeCoverIntro(reportDef, d) : ""}
  ${intBanner}
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
          <div style="color:#881337;line-height:1.7;">No explicit field in source data.<br/>Leads classified as vehicle-secured<br/>based on: loan &gt;€15k OR term &gt;60 months.</div></div>
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
      Underwriting should be based on income and DTI — no vehicle valuation required from the partner.
    </div>
  </div>` : ""}
  ${isInternal||isVertical||isSegment||isPartner||isPremium ? `<div class="section"><div class="two-col">${domainSection}${residSection}</div></div>` : ""}
  ${leadsTableSection}
  ${makeFooter(today, isInternal, isPremium)}
</div></body></html>`;

  return html;
}
