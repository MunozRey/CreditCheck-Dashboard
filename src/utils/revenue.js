// ─── REVENUE HELPERS ──────────────────────────────────────────────────────────
// Note: MONTHS, monthKey, todayYM are canonical in format.js — import from there.

export const calcRev = (model, count, s) => {
  if (!count||!s) return 0;
  const n = v => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };
  const cpa = n(count)*(n(s.convRate)/100)*n(s.ticket)*(n(s.commission)/100);
  if (model==="cpl")    return n(count)*n(s.cplRate);
  if (model==="cpa")    return cpa;
  if (model==="hybrid") return n(count)*n(s.cplRate)+cpa;
  return 0;
};

export const PRESETS = {
  cpl:[
    {label:"Conservative",bc:{cplRate:8},  fs:{cplRate:5}},
    {label:"Base",         bc:{cplRate:11}, fs:{cplRate:7}},
    {label:"Optimistic",   bc:{cplRate:14}, fs:{cplRate:9}},
  ],
  cpa:[
    {label:"Personal", bc:{convRate:20,ticket:8000,  commission:1.50},fs:{convRate:12,ticket:5000,  commission:1.00}},
    {label:"Base",     bc:{convRate:25,ticket:15000, commission:2.00},fs:{convRate:15,ticket:8000,  commission:1.50}},
    {label:"Mortgage", bc:{convRate:15,ticket:180000,commission:0.75},fs:{convRate:8, ticket:150000,commission:0.50}},
  ],
  hybrid:[
    {label:"Personal", bc:{cplRate:5, convRate:20,ticket:8000,  commission:1.00},fs:{cplRate:3,convRate:12,ticket:5000,  commission:0.75}},
    {label:"Base",     bc:{cplRate:7, convRate:25,ticket:15000, commission:1.50},fs:{cplRate:4,convRate:15,ticket:8000,  commission:1.00}},
    {label:"Mortgage", bc:{cplRate:10,convRate:15,ticket:180000,commission:0.50},fs:{cplRate:6,convRate:8, ticket:150000,commission:0.30}},
  ],
};

export function newPartner(name, color) {
  return {
    id: typeof crypto!=="undefined"&&crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    name,
    color: color ?? "#0A1264",
    active: true,
    model: "cpl",
    bcS: { cplRate:11, convRate:25, ticket:15000, commission:2.0 },
    fsS: { cplRate:7,  convRate:15, ticket:8000,  commission:1.5 },
  };
}

export function newMonthEntry(partnerId) {
  return { partnerId, bcCount:0, fsCount:0, note:"" };
}
