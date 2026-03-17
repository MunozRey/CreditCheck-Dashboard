import { T } from "./themes.js";

// ─── COUNTRY META ─────────────────────────────────────────────────────────────
export const COUNTRY_META = {
  es: { flag:"🇪🇸", label:"Spain",             lang:"spanish",    color:"#C60B1E", primary:true  },
  en: { flag:"🌍",  label:"English-speaking",   lang:"english",    color:"#4B5563", primary:false },
  pt: { flag:"🇵🇹", label:"Portugal",           lang:"portuguese", color:"#006600", primary:false },
  it: { flag:"🇮🇹", label:"Italy",              lang:"italian",    color:"#008C45", primary:false },
  fr: { flag:"🇫🇷", label:"France",             lang:"french",     color:"#0055A4", primary:false },
  de: { flag:"🇩🇪", label:"Germany",            lang:"german",     color:"#333333", primary:false },
  nl: { flag:"🇳🇱", label:"Netherlands",        lang:"dutch",      color:"#AE1C28", primary:false },
  pl: { flag:"🇵🇱", label:"Poland",             lang:"polish",     color:"#DC143C", primary:false },
};

// ─── VERTICAL DEFINITIONS ─────────────────────────────────────────────────────
// NOTE: refinance ≠ home_improvement — completely different products, partners & pricing
// refinance/mortgage: tied to property valuation, regulated, long-term
// home_improvement: unsecured personal credit up to €50k, faster closing
export const VERTICALS_DEF = {
  personal_loans: {
    id:"personal_loans", label:"Personal Loans", icon:"💳",
    color:"#005EFF", lightBg:T.surface3, border:"rgba(59,130,246,0.3)",
    purposes:["personal_expenses","other","holiday","education","it_equipment"],
    desc:"Unsecured consumer credit — expenses, lifestyle, education",
    partnerTypes:["Consumer finance","BNPL","Neobanks","Credit unions","Fintech lenders"],
    creditNote:"Unsecured · up to €50k · 6–84 months · no collateral",
    modelNote:"CPL €8–12 or CPA 1–1.5% for consumer credit partners",
    stats:{ avgIncome:2017, avgLoan:7511, avgAge:51, bcRate:39 },
  },
  reform: {
    id:"reform", label:"Home Reform", icon:"🔨",
    color:"#00A651", lightBg:"#EDFAF3", border:"rgba(16,185,129,0.3)",
    purposes:["home_improvement"],
    desc:"Home reform & improvement — unsecured credit, no property appraisal",
    partnerTypes:["Reform financing companies","Home improvement lenders","Consumer banks","BNPL for reform"],
    creditNote:"Unsecured personal credit · avg €7.9k · median €3k · 42% homeowners",
    modelNote:"CPL €10–18 or CPA 1–2% · faster closing than mortgage · no appraisal needed",
    stats:{ avgIncome:2124, avgLoan:7856, avgAge:51, bcRate:36, homeowners:42 },
    insightNote:"83% of reform leads request <€15k — typical unsecured personal credit range. Only 13 leads request >€15k where secured products might apply.",
  },
  mortgage: {
    id:"mortgage", label:"Refinance", icon:"🏦",
    color:"#6D28D9", lightBg:T.surface3, border:"rgba(139,92,246,0.3)",
    purposes:["refinance"],
    desc:"Mortgage refinancing — tied to property valuation, regulated product",
    partnerTypes:["Mortgage brokers","Banks","Savings banks (Cajas)","Intermediarios hipotecarios"],
    creditNote:"Secured by property · avg €14.9k requested · 39% homeowners · avg 67 months · 82% have existing loans",
    modelNote:"CPL €20–50 or fixed fee per qualified lead · regulated by LCCI · longer sales cycle",
    stats:{ avgIncome:2009, avgLoan:14893, avgAge:52, bcRate:25, homeowners:39 },
    insightNote:"25% BC rate is lower — expected for mortgage (higher intent bar). 82% have existing loans (refinance intent confirmed). Needs LCCI compliance from partner.",
    regulatory:"⚖️ LCCI regulated (Ley 5/2019) · Intermediarios hipotecarios need BDER registration · Mandatory cooling-off period",
  },
  vehicle_unsecured: {
    id:"vehicle_unsecured", label:"Vehicle — Personal Credit", icon:"🚗",
    color:"#F59E0B", lightBg:T.amberBg, border:"rgba(245,158,11,0.4)",
    purposes:["vehicle"],
    vehicleFilter:"unsecured",
    desc:"Personal unsecured credit for vehicle purchase — vehicle is the destination, not the collateral",
    partnerTypes:["Consumer finance (Cetelem, Cofidis)","Car dealers with own financing","Banks (personal loan product)","Neobanks"],
    creditNote:"Unsecured personal credit · no vehicle guarantee · loan ≤€15k · term ≤60 months · ~14 leads in current batch",
    modelNote:"CPL €8–15 · same product as personal loan but vehicle-purpose declared · faster approval · no registration needed",
    insightNote:"70% of vehicle leads fall here. Standard personal credit product — partners underwrite on income/DTI, not vehicle value.",
    stats:{ avgIncome:1952, avgLoan:4500, avgAge:48, bcRate:30 },
  },
  vehicle_secured: {
    id:"vehicle_secured", label:"Vehicle — Secured Credit", icon:"🔐",
    color:"#DC2626", lightBg:T.redBg, border:"rgba(239,68,68,0.3)",
    purposes:["vehicle"],
    vehicleFilter:"secured",
    desc:"Credit with vehicle as collateral — the vehicle is the guarantee, not just the purchase destination",
    partnerTypes:["Auto financing entities (ALD, Arval)","Specialized vehicle lenders","Dealers with secured financing","Banks (auto loan product)"],
    creditNote:"Secured by vehicle · loan >€15k or term >60 months · vehicle valuation required · registration as collateral",
    modelNote:"CPL €20–40 · higher ticket, longer cycle · partner needs vehicle valuation process (ITV, tasación)",
    insightNote:"30% of vehicle leads. Loans up to €45k at 120 months only make sense with vehicle as guarantee.",
    regulatory:"Vehicle registration as collateral requires notarial process (reserva de dominio or prenda sin desplazamiento).",
    stats:{ avgIncome:2200, avgLoan:22000, avgAge:47, bcRate:17 },
  },
};

// Vehicle heuristic: inferred from loan size + term since no explicit field exists in XLSX
export function applyVehicleFilter(leads, vehFilter) {
  if (vehFilter === "unsecured") return leads.filter(r => (r.loanAmount||0) <= 15000 && (r.loanMonths||0) <= 60);
  if (vehFilter === "secured")   return leads.filter(r => (r.loanAmount||0) > 15000  || (r.loanMonths||0) > 60);
  return leads;
}
