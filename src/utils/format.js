// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────

export const fmtEur = n => {
  if (isNaN(n)||!isFinite(n)) return "€—";
  if (n<0) return `-${fmtEur(-n)}`;
  return n>=1_000_000?`€${(n/1_000_000).toFixed(2)}M`:n>=1_000?`€${(n/1_000).toFixed(1)}k`:`€${n.toFixed(2)}`;
};

export const fmtNum = n => (!isFinite(n)||isNaN(n))?"—":n>=1_000?`${(n/1_000).toFixed(1)}k`:`${Math.round(n)}`;

export const fmtK = n => n >= 1000 ? `€${(n/1000).toFixed(0)}k` : `€${n}`;

export const isValidEmail = e =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e||"") &&
  !["test","example","asda","boraitaformacion"].some(d=>(e||"").includes(d));

export const qualityGrade = (cat) => cat==="Bank Connected"?"A":"B";

export function toTitleCase(str) {
  return (str||"").toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function monthKey(y, m) { return `${y}-${String(m+1).padStart(2,'0')}`; }
export function todayYM() { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; }

export function fmtAgo(date) {
  if (!date) return "";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
