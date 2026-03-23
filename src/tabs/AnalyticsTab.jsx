import React, { useState, useMemo, useId } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { useTheme, getCatStyle, getGradeStyle } from '../context/ThemeContext.jsx';
import { fmtNum } from '../utils/format.js';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import CustomTooltip from '../components/CustomTooltip.jsx';

export default function AnalyticsTab({ data }) {
  const { T } = useTheme();
  const CAT_STYLE   = getCatStyle(T);
  const GRADE_STYLE = getGradeStyle(T);

  const [bcOnlyMode, setBcOnlyMode] = useState(true);

  const bc  = data["Bank Connected"] || [];
  const fs  = data["Form Submitted"] || [];

  // ── Empty state ──────────────────────────────────────────────────────────
  if (bc.length === 0 && fs.length === 0) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", gap:16, textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:16, background:T.surface2, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>📊</div>
        <div style={{ fontSize:18, fontWeight:700, color:T.text, fontFamily:"'Playfair Display',serif", letterSpacing:-0.3 }}>No data to analyse</div>
        <div style={{ fontSize:13, color:T.muted, maxWidth:380, lineHeight:1.6 }}>
          Upload a CreditCheck XLSX export or connect the live feed to see conversion trends, BC rates, and monthly breakdowns.
        </div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {[["📈","BC Rate","% of active leads that connect bank"],["📅","Daily trend","Leads per day over time"],["🗓","Monthly","Volume by month & category"]].map(([icon,label,desc])=>(
            <div key={label} style={{ padding:"12px 16px", borderRadius:12, border:`1px solid ${T.border}`, background:T.surface2, textAlign:"center", minWidth:120 }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:11, fontWeight:700, color:T.text }}>{label}</div>
              <div style={{ fontSize:10, color:T.muted, marginTop:3, lineHeight:1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const all = useMemo(() => [
    ...bc.map(r => ({ ...r, cat: "Bank Connected" })),
    ...fs.map(r => ({ ...r, cat: "Form Submitted" })),
  ], [bc, fs]);

  const dailySeries = useMemo(() => {
    const map = {};
    all.forEach(r => {
      if (!r.created) return;
      if (!map[r.created]) map[r.created] = { date: r.created, label: r.created.slice(5), BC: 0, FS: 0 };
      if (r.cat === "Bank Connected") map[r.created].BC++; else map[r.created].FS++;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, total: d.BC + d.FS, bcRate: d.BC + d.FS > 0 ? Math.round((d.BC / (d.BC + d.FS)) * 100) : 0 }));
  }, [all]);

  const bcDays       = useMemo(() => dailySeries.filter(d => d.BC > 0), [dailySeries]);
  const bcOnlySeries = bcDays;

  const gradeDist = [
    { name: "A — Premium (Bank Connected)",  value: bc.length, color: T.navy },
    { name: "B — Standard (Form Submitted)", value: fs.length, color: T.blue },
  ];
  const bcRatio = all.length > 0 ? ((bc.length / all.length) * 100).toFixed(1) : 0;

  const peakBC    = bcDays.length > 0 ? Math.max(...bcDays.map(d => d.BC)) : 0;
  const peakLabel = bcDays.find(d => d.BC === peakBC)?.label || "—";

  const half           = Math.ceil(bcDays.length / 2);
  const recentBCTotal  = bcDays.slice(half).reduce((s, d) => s + d.BC, 0);
  const prevBCTotal    = bcDays.slice(0, half).reduce((s, d) => s + d.BC, 0);
  const bcTrend        = prevBCTotal > 0 ? Math.round(((recentBCTotal - prevBCTotal) / prevBCTotal) * 100) : 0;

  const dataSpanDays     = Math.max(new Set(bc.map(r => r.created).filter(Boolean)).size, 1);
  const dailyBCAvg       = bc.length / dataSpanDays;
  const dailyFSEstimate  = fs.length / dataSpanDays;

  const gradId = useId().replace(/:/g, "_");

  const monthlySeries = useMemo(() => {
    const map = {};
    const addRow = (r, cat) => {
      if (!r.created) return;
      const ym = r.created.slice(0, 7); // "YYYY-MM"
      if (!map[ym]) map[ym] = { ym, label: ym.slice(0, 7), BC: 0, FS: 0 };
      if (cat === "Bank Connected") map[ym].BC++; else map[ym].FS++;
    };
    bc.forEach(r => addRow(r, "Bank Connected"));
    fs.forEach(r => addRow(r, "Form Submitted"));
    return Object.values(map)
      .sort((a, b) => a.ym.localeCompare(b.ym))
      .map(d => ({ ...d, total: d.BC + d.FS, bcRate: d.BC + d.FS > 0 ? Math.round(d.BC / (d.BC + d.FS) * 100) : 0 }));
  }, [bc, fs]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KpiCard label="BC Rate"        value={`${bc.length + fs.length > 0 ? Math.round(bc.length / (bc.length + fs.length) * 100) : 0}%`} sub="of active leads (BC+FS)" accent={T.navy} trend={bcTrend} trendLabel="vs previous period" />
        <KpiCard label="Funnel Conv."   value={`${all.length > 0 ? ((bc.length / (bc.length + fs.length + (data["Incomplete"] || []).length)) * 100).toFixed(1) : 0}%`} sub="of all entries incl. drop-offs" accent={T.blue} />
        <KpiCard label="Daily Peak (BC)" value={peakBC} sub={peakLabel} accent={T.blue2} />
        <KpiCard label="Avg BC/day"     value={dailyBCAvg.toFixed(1)} sub={`over ${dataSpanDays} days`} accent={T.blue3} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <Card style={{ padding: "20px 20px 12px" }}>
          <SectionTitle>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Lead Volume per Day</h3>
            <span style={{ fontSize: 10, color: T.muted }}>* FS: Pipedrive export date, not acquisition date</span>
          </SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailySeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip hint="BC = Open Banking connected · FS = form completed only" />} />
              <Legend wrapperStyle={{ fontSize: 11, color: T.muted }} />
              <Bar dataKey="BC" name="Bank Connected" fill={T.navy}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="FS" name="Form Submitted" fill={T.blue3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: "20px" }}>
          <SectionTitle>Quality Distribution</SectionTitle>
          <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
            {gradeDist.map(g => (
              <div key={g.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color }} />
                    <span style={{ fontSize: 11, color: T.textSub }}>{g.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{g.value}</span>
                </div>
                <div style={{ height: 8, background: T.surface2, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${all.length > 0 ? (g.value / all.length) * 100 : 0}%`, background: g.color, borderRadius: 4, transition: "width .4s" }} />
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{all.length > 0 ? ((g.value / all.length) * 100).toFixed(1) : 0}% of total</div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              {Object.entries(GRADE_STYLE).map(([g, s]) => (
                <div key={g} style={{ padding: "12px", background: s.bg, borderRadius: 8, textAlign: "center", border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{g}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: "20px 20px 12px" }}>
        <SectionTitle>BC Rate per Day (% premium leads)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={bcOnlySeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.navy} stopOpacity={0.15} />
                <stop offset="95%" stopColor={T.navy} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip formatter={v => `${v}%`} hint="BC Rate = Bank Connected ÷ (BC + FS) × 100. Higher is better — indicates lead quality." />} />
            <Area type="monotone" dataKey="bcRate" name="BC Rate" stroke={T.navy} strokeWidth={2.5} fill={`url(#${gradId})`} dot={{ fill: T.navy, r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          {[["< 20%", "Low", T.red], ["20–35%", "Mid", T.amber], ["> 35%", "Optimal", T.green]].map(([r, l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
              <span style={{ fontSize: 11, color: T.muted }}>{r} = {l}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: "20px" }}>
        <SectionTitle>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Volume Projection</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: T.muted }}>{dailyBCAvg.toFixed(1)} BC/day{!bcOnlyMode && ` · ${dailyFSEstimate.toFixed(1)} FS/day`}</span>
            <div style={{ display: "flex", background: T.surface2, borderRadius: 8, padding: 2, gap: 2 }}>
              <button onClick={() => setBcOnlyMode(true)}  style={{ padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, background: bcOnlyMode  ? T.navy : "transparent", color: bcOnlyMode  ? "#fff" : T.muted, transition: "all .15s" }}>BC Only</button>
              <button onClick={() => setBcOnlyMode(false)} style={{ padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, background: !bcOnlyMode ? T.navy : "transparent", color: !bcOnlyMode ? "#fff" : T.muted, transition: "all .15s" }}>BC + FS</button>
            </div>
          </div>
        </SectionTitle>
        {bcOnlyMode && <div style={{ marginBottom: 12, padding: "8px 12px", background: T.amberBg, borderRadius: 8, fontSize: 11, color: T.amber, border: `1px solid ${T.amber}40`, display: "flex", alignItems: "center", gap: 6 }}><svg width="13" height="12" viewBox="0 0 14 13" fill="none" style={{ flexShrink: 0 }}><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.7" fill="currentColor"/></svg> Projection based on BC only — FS leads are currently not being added to the pipeline.</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[["7 days", 7], ["30 days", 30], ["90 days", 90], ["12 months", 365]].map(([label, days]) => {
            const projBC    = Math.round(dailyBCAvg * days);
            const projFS    = bcOnlyMode ? 0 : Math.round(dailyFSEstimate * days);
            const projTotal = projBC + projFS;
            const projRate  = projTotal > 0 ? Math.round((projBC / projTotal) * 100) : 0;
            return (
              <div key={label} style={{ padding: "16px", background: T.surface2, borderRadius: 10, borderTop: `3px solid ${T.navy}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{fmtNum(projTotal)}</div>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 10 }}>estimated leads</div>
                <div style={{ display: "grid", gridTemplateColumns: bcOnlyMode ? "1fr" : "1fr 1fr", gap: 6 }}>
                  <div style={{ background: CAT_STYLE["Bank Connected"].light, borderRadius: 6, padding: "6px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>{fmtNum(projBC)}</div>
                    <div style={{ fontSize: 9, color: T.muted }}>BC</div>
                  </div>
                  {!bcOnlyMode && <div style={{ background: CAT_STYLE["Form Submitted"].light, borderRadius: 6, padding: "6px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.blue }}>{fmtNum(projFS)}</div>
                    <div style={{ fontSize: 9, color: T.muted }}>FS</div>
                  </div>}
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: T.muted, textAlign: "center" }}>{bcOnlyMode ? "BC only" : ` BC Rate: ${projRate}%`}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Conversion Funnel */}
      <Card style={{ padding: "20px" }}>
        <SectionTitle>Conversion Funnel</SectionTitle>
        {(() => {
          const inc = (data["Incomplete"] || []).length;
          const total = bc.length + fs.length + inc;
          const steps = [
            { label: "Total Entries", value: total, color: T.text },
            { label: "Form Submitted", value: bc.length + fs.length, color: T.blue },
            { label: "Bank Connected", value: bc.length, color: T.green },
            { label: "Email Verified", value: bc.filter(r => r.emailVerified).length, color: T.navy },
          ];
          return (
            <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
              {steps.map((s, i) => {
                const pct = total > 0 ? (s.value / total * 100) : 0;
                const dropOff = i > 0 && steps[i-1].value > 0 ? ((steps[i-1].value - s.value) / steps[i-1].value * 100).toFixed(0) : null;
                return (
                  <React.Fragment key={s.label}>
                    <div style={{ flex: 1, textAlign: "center", padding: "16px 8px", background: `${s.color}08`, borderRadius: 10, border: `1px solid ${s.color}20`, position: "relative" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'IBM Plex Mono',monospace" }}>{s.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginTop: 4 }}>{pct.toFixed(1)}%</div>
                      {/* Progress bar */}
                      <div style={{ marginTop: 8, height: 6, background: T.surface2, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 3, transition: "width .5s ease" }} />
                      </div>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 4px", minWidth: 40 }}>
                        <div style={{ fontSize: 16, color: T.border }}>→</div>
                        {dropOff !== null && <div style={{ fontSize: 9, color: T.red, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>-{dropOff}%</div>}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })()}
      </Card>

      {/* Monthly trend chart */}
      {monthlySeries.length > 1 && (
        <Card style={{ padding: "20px 20px 14px" }}>
          <SectionTitle>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Month-over-Month Trend</h3>
            <span style={{ fontSize: 10, color: T.muted }}>BC + FS leads by calendar month</span>
          </SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: T.muted }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip content={<CustomTooltip hint="Monthly lead volume by category. Trends show pipeline health over time." />} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10, color: T.muted }} />
              <Bar dataKey="BC" name="Bank Connected" fill={T.navy} radius={[3, 3, 0, 0]} />
              <Bar dataKey="FS" name="Form Submitted" fill={T.blue3} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
            {monthlySeries.map((d, i) => (
              <div key={i} style={{ flexShrink: 0, textAlign: "center", minWidth: 52, padding: "6px 8px", background: T.surface2, borderRadius: 7 }}>
                <div style={{ fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 2 }}>{d.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.navy }}>{d.total}</div>
                <div style={{ fontSize: 9, color: T.blue, fontFamily: "'IBM Plex Mono',monospace" }}>{d.bcRate}% BC</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
