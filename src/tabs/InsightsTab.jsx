import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import CustomTooltip from '../components/CustomTooltip.jsx';

export default function InsightsTab({ data }) {
  const { T } = useTheme();
  const bc  = data['Bank Connected']  || [];
  const fs  = data['Form Submitted']  || [];
  const inc = data['Incomplete']      || [];
  const all = [...bc, ...fs, ...inc];
  const enriched = all.filter(r => r.income != null);

  if (enriched.length === 0) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: T.muted }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>No enriched data available</div>
        <div style={{ fontSize: 13 }}>Upload a CreditScore XLSX (Rasmus format) to unlock this tab.</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Required columns: Age, Monthly Net Income, Loan Purpose, Employment Status, etc.</div>
      </div>
    );
  }

  const avg    = arr => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
  const median = arr => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
  const fmtK   = n => n >= 1000 ? `€${(n / 1000).toFixed(0)}k` : `€${n}`;
  const clean  = (arr, field) => arr.map(r => r[field]).filter(v => v != null && v > 0);

  const incomeChart = useMemo(() => {
    const buckets = [
      { label: '<€1k',  min: 0,    max: 999 },
      { label: '€1-2k', min: 1000, max: 1999 },
      { label: '€2-3k', min: 2000, max: 2999 },
      { label: '€3-5k', min: 3000, max: 4999 },
      { label: '>€5k',  min: 5000, max: Infinity },
    ];
    return buckets.map(b => ({
      label: b.label,
      BC:  bc.filter(r => r.income >= b.min && r.income <= b.max).length,
      FS:  fs.filter(r => r.income >= b.min && r.income <= b.max).length,
      Inc: inc.filter(r => r.income >= b.min && r.income <= b.max).length,
    }));
  }, [bc, fs, inc]);

  const purposeChart = useMemo(() => {
    const purposeCount = {};
    [...bc, ...fs].forEach(r => { if (!r.purpose) return; const p = r.purpose.replace(/_/g, ' '); purposeCount[p] = (purposeCount[p] || 0) + 1; });
    return Object.entries(purposeCount).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([label, value]) => ({ label, value }));
  }, [bc, fs]);

  const empChart = useMemo(() => {
    const empCount = {};
    [...bc, ...fs].forEach(r => { if (!r.employment) return; const e = r.employment.replace(/_/g, ' '); empCount[e] = (empCount[e] || 0) + 1; });
    return Object.entries(empCount).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [bc, fs]);

  const ageChart = useMemo(() => {
    const ageBuckets = [{ label: '18-30', min: 18, max: 30 }, { label: '31-45', min: 31, max: 45 }, { label: '46-60', min: 46, max: 60 }, { label: '61+', min: 61, max: 120 }];
    return ageBuckets.map(b => ({
      label: b.label,
      BC: bc.filter(r => r.age >= b.min && r.age <= b.max).length,
      FS: fs.filter(r => r.age >= b.min && r.age <= b.max).length,
    }));
  }, [bc, fs]);

  const loanChart = useMemo(() => {
    const loanBuckets = [{ label: '<€3k', min: 0, max: 2999 }, { label: '€3-8k', min: 3000, max: 7999 }, { label: '€8-15k', min: 8000, max: 14999 }, { label: '€15-30k', min: 15000, max: 29999 }, { label: '>€30k', min: 30000, max: Infinity }];
    return loanBuckets.map(b => ({
      label: b.label,
      BC: bc.filter(r => r.loanAmount >= b.min && r.loanAmount <= b.max).length,
      FS: fs.filter(r => r.loanAmount >= b.min && r.loanAmount <= b.max).length,
    }));
  }, [bc, fs]);

  const allIncomes = useMemo(() => clean([...bc, ...fs], 'income'), [bc, fs]);
  const allLoans   = useMemo(() => clean([...bc, ...fs], 'loanAmount'), [bc, fs]);
  const bcIncomes  = useMemo(() => clean(bc, 'income'), [bc]);
  const fsIncomes  = useMemo(() => clean(fs, 'income'), [fs]);
  const convRate   = (bc.length / (bc.length + fs.length + inc.length) * 100).toFixed(1);
  const dropRate   = (inc.length / (bc.length + fs.length + inc.length) * 100).toFixed(1);
  const dti = useMemo(() => [...bc, ...fs].filter(r => r.income && r.expenses).map(r => Math.round((r.expenses / r.income) * 100)), [bc, fs]);

  const COLORS = [T.navy, T.blue, T.blue2, T.blue3, T.green, T.amber, T.red];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
        <KpiCard label="Avg Income"       value={fmtK(avg(allIncomes))}  sub={`Median ${fmtK(median(allIncomes))}`} accent={T.navy} />
        <KpiCard label="Avg Loan Request" value={fmtK(avg(allLoans))}    sub={`Median ${fmtK(median(allLoans))}`}  accent={T.blue} />
        <KpiCard label="BC Avg Income"    value={fmtK(avg(bcIncomes))}   sub={`vs FS ${fmtK(avg(fsIncomes))}`}     accent={T.blue2} />
        <KpiCard label="Funnel Conv."     value={`${convRate}%`}         sub="of all entries incl. drop-offs"      accent={T.green} />
        <KpiCard label="Drop-off Rate"    value={`${dropRate}%`}         sub="cancelled / incomplete"              accent={T.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <Card style={{ padding: '20px 20px 12px' }}>
          <SectionTitle>Income Distribution by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeChart} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip hint="Monthly net income bucket. BC leads typically cluster in higher income brackets." />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="BC"  name="Bank Connected" fill={T.navy}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="FS"  name="Form Submitted" fill={T.blue3} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Inc" name="Incomplete"     fill={T.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px 20px 12px' }}>
          <SectionTitle>Age Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip hint="Age bracket of applicants. Prime segment (30–55) scores highest on the age factor." />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="BC" name="Bank Connected" fill={T.navy}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="FS" name="Form Submitted" fill={T.blue3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: '20px' }}>
          <SectionTitle>Loan Purpose</SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {purposeChart.map((p, i) => {
              const pct = Math.round(p.value / (bc.length + fs.length) * 100);
              return (
                <div key={p.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.text, textTransform: 'capitalize' }}>{p.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length] }}>{p.value} <span style={{ fontWeight: 400, color: T.muted }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 7, background: T.surface2, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <SectionTitle>Employment Status</SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {empChart.map((e, i) => {
              const pct = Math.round(e.value / (bc.length + fs.length) * 100);
              return (
                <div key={e.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.text, textTransform: 'capitalize' }}>{e.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length] }}>{e.value} <span style={{ fontWeight: 400, color: T.muted }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 7, background: T.surface2, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <Card style={{ padding: '20px 20px 12px' }}>
          <SectionTitle>Requested Loan Amount Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={loanChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip hint="Requested loan amount bracket. Larger loans correlate with higher income and stronger DTI." />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="BC" name="Bank Connected" fill={T.navy}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="FS" name="Form Submitted" fill={T.blue3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px' }}>
          <SectionTitle>Debt-to-Income Ratio</SectionTitle>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['< 30%',  'Solvent',    0,  29,       T.green,  '#'],
              ['30–35%', 'Acceptable', 30, 34,       '#65A30D', '~'],
              ['35–40%', 'Tight',      35, 39,       T.amber,  '!'],
              ['40–50%', 'High risk',  40, 49,       '#F97316', '!!'],
              ['> 50%',  'Exclusion',  50, Infinity, T.red,    '✕'],
            ].map(([range, label, min, max, color]) => {
              const count = dti.filter(v => v >= min && v <= max).length;
              const pct   = dti.length ? Math.round(count / dti.length * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 4, padding: '1px 5px', letterSpacing: 0.5 }}>{range}</span>
                      <span style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', fontFamily: "'IBM Plex Mono',monospace" }}>
                      {count} <span style={{ color: T.muted, fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: T.surface2, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 6, padding: '10px 12px', background: T.surface2, borderRadius: 8, fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.6 }}>
              Spain criterion · Banco de España / Ley 5/2019 LCCI<br />
              {dti.length} leads with complete data · critical threshold 35–40%
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: '20px' }}>
        <SectionTitle>Conversion Funnel</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, position: 'relative' }}>
          {[
            { label: 'Total Entries',   value: all.length,                                        color: T.navy,  pct: 100 },
            { label: 'Form Completed',  value: bc.length + fs.length,                             color: T.blue,  pct: Math.round((bc.length + fs.length) / all.length * 100) },
            { label: 'Bank Connected',  value: bc.length,                                         color: T.blue2, pct: Math.round(bc.length / all.length * 100) },
            { label: 'Email Verified',  value: all.filter(r => r.emailVerified).length,           color: T.green, pct: Math.round(all.filter(r => r.emailVerified).length / Math.max(all.length, 1) * 100) },
          ].map((step, i, arr) => (
            <div key={step.label} style={{ textAlign: 'center', padding: '20px 10px', position: 'relative' }}>
              <div style={{ height: 6, background: step.color, borderRadius: i === 0 ? '4px 0 0 4px' : i === arr.length - 1 ? '0 4px 4px 0' : '0', marginBottom: 16, opacity: 0.85 }} />
              <div style={{ fontSize: 28, fontWeight: 900, color: step.color }}>{step.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginTop: 4 }}>{step.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: step.color, marginTop: 4 }}>{step.pct}%</div>
              {i < arr.length - 1 && <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: T.muted, zIndex: 1 }}>›</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
