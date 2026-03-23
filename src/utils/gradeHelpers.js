// ─── GRADE DISPLAY HELPERS ────────────────────────────────────────────────────
// Presentation-only — pass the current T from useTheme().

export const GRADE_COLOR = (T, s) => s >= 75 ? T.green : s >= 50 ? T.blue : s >= 30 ? T.amber : T.red;
export const GRADE_LABEL = s => s >= 75 ? "A" : s >= 50 ? "B" : s >= 30 ? "C" : "D";

export const EMP_OPTIONS = [
  { value:"all",           label:"All Employment" },
  { value:"civil_servant", label:"Civil Servant" },
  { value:"employed",      label:"Employed" },
  { value:"self_employed", label:"Self-Employed" },
  { value:"retired",       label:"Retired" },
  { value:"part_time",     label:"Part-Time" },
  { value:"unemployed",    label:"Unemployed" },
];
