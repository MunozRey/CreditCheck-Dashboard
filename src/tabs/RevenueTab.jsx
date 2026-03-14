import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTheme, getModelColors } from '../context/ThemeContext.jsx';
import { calcRev, MONTHS, monthKey, todayYM } from '../utils/revenue.js';
import { fmtEur } from '../utils/format.js';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import MonthNav from '../components/MonthNav.jsx';
import CustomTooltip from '../components/CustomTooltip.jsx';

export default function RevenueTab({ partners, monthData }) {
  const { T } = useTheme();
  const MODEL_COLORS = getModelColors(T);

  const { y: ty, m: tm } = todayYM();
  const [y, setY] = useState(ty);
  const [m, setM] = useState(tm);

  const key    = monthKey(y, m);
  const active = partners.filter(p => p.active);

  const getEntry = (pid) => (monthData[key] || {})[pid] || { bcCount: 0, fsCount: 0 };

  const totRev   = active.reduce((s, p) => { const e = getEntry(p.id); return s + calcRev(p.model, e.bcCount, p.bcS) + calcRev(p.model, e.fsCount, p.fsS); }, 0);
  const totBC    = active.reduce((s, p) => s + getEntry(p.id).bcCount, 0);
  const totFS    = active.reduce((s, p) => s + getEntry(p.id).fsCount, 0);
  const totLeads = totBC + totFS;
  const totBCRev = active.reduce((s, p) => s + calcRev(p.model, getEntry(p.id).bcCount, p.bcS), 0);
  const totFSRev = active.reduce((s, p) => s + calcRev(p.model, getEntry(p.id).fsCount, p.fsS), 0);

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const mm  = m - 5 + i, yy = y + Math.floor(mm / 12), mm2 = ((mm % 12) + 12) % 12;
    const k   = monthKey(yy, mm2), md = monthData[k] || {};
    const rev = active.reduce((s, p) => { const e = md[p.id] || { bcCount: 0, fsCount: 0 }; return s + calcRev(p.model, e.bcCount, p.bcS) + calcRev(p.model, e.fsCount, p.fsS); }, 0);
    const leads = active.reduce((s, p) => { const e = md[p.id] || { bcCount: 0, fsCount: 0 }; return s + e.bcCount + e.fsCount; }, 0);
    return { label: MONTHS[mm2].slice(0, 3), rev, leads, key: monthKey(yy, mm2) };
  });

  const partnerRows = partners.map(p => {
    const e = getEntry(p.id);
    const bcRev = calcRev(p.model, e.bcCount, p.bcS);
    const fsRev = calcRev(p.model, e.fsCount, p.fsS);
    return { ...p, bcCount: e.bcCount, fsCount: e.fsCount, bcRev, fsRev, tot: bcRev + fsRev };
  }).filter(p => p.tot > 0 || p.bcCount > 0 || p.fsCount > 0);

  const noData = totLeads === 0;

  // ── Revenue summary: previous month for MoM comparison ───────────────────
  const prevM = m === 0 ? 11 : m - 1;
  const prevY = m === 0 ? y - 1 : y;
  const prevKey = monthKey(prevY, prevM);
  const prevTotRev = active.reduce((s, p) => {
    const e = (monthData[prevKey] || {})[p.id] || { bcCount: 0, fsCount: 0 };
    return s + calcRev(p.model, e.bcCount, p.bcS) + calcRev(p.model, e.fsCount, p.fsS);
  }, 0);
  const momDelta  = prevTotRev > 0 ? Math.round(((totRev - prevTotRev) / prevTotRev) * 100) : null;
  const topPartner = partnerRows.length > 0 ? partnerRows.reduce((best, p) => p.tot > best.tot ? p : best, partnerRows[0]) : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Revenue summary card */}
      {(totRev > 0 || prevTotRev > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            {
              label: "Total Revenue", accent: [T.navy, T.blue],
              main: fmtEur(totRev), mainColor: T.navy,
              sub: `${MONTHS[m]} ${y} · ${active.length} active partner${active.length !== 1 ? "s" : ""}`,
            },
            {
              label: `vs ${MONTHS[prevM]}`, accent: [momDelta != null && momDelta >= 0 ? T.green : T.red, "transparent"],
              main: momDelta !== null ? `${momDelta >= 0 ? "+" : ""}${momDelta}%` : "No prior data",
              mainColor: momDelta !== null ? (momDelta >= 0 ? T.green : T.red) : T.muted,
              sub: momDelta !== null ? `Prev: ${fmtEur(prevTotRev)}` : "",
            },
            {
              label: "Top Partner", accent: [T.blue, "transparent"],
              main: topPartner ? topPartner.name : "—", mainColor: T.text, mainSmall: true,
              sub: topPartner ? fmtEur(topPartner.tot) : "",
            },
          ].map((card, i) => (
            <div key={i} style={{ padding: "16px 20px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${card.accent[0]},${card.accent[1]})` }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, fontFamily: "'IBM Plex Mono',monospace" }}>{card.label}</div>
              <div style={{ fontSize: card.mainSmall ? 15 : 26, fontWeight: 900, color: card.mainColor, letterSpacing: card.mainSmall ? -0.2 : -0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.main}</div>
              {card.sub && <div style={{ fontSize: card.mainSmall ? 18 : 10, fontWeight: card.mainSmall ? 800 : 400, color: card.mainSmall ? T.blue : T.muted, marginTop: 3 }}>{card.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <MonthNav y={y} m={m} onChange={(ny, nm) => { setY(ny); setM(nm); }} />
        <div style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue, display: "inline-block" }} />
          Revenue pulled from Partners tab — edit leads &amp; rates there
        </div>
      </div>

      {noData ? (
        <Card style={{ padding: 48, textAlign: "center" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: T.muted }}>
            <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="10" width="3" height="8" rx="1" fill="currentColor" opacity=".4"/>
              <rect x="7" y="6" width="3" height="12" rx="1" fill="currentColor" opacity=".7"/>
              <rect x="12" y="3" width="3" height="15" rx="1" fill="currentColor"/>
              <rect x="17" y="8" width="3" height="10" rx="1" fill="currentColor" opacity=".55"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>No data for {MONTHS[m]} {y}</div>
          <div style={{ fontSize: 12, color: T.muted }}>Go to the <strong>Partners</strong> tab and enter leads for this month.</div>
        </Card>
      ) : (<>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <KpiCard label="Total Revenue"  value={fmtEur(totRev)}                              sub={`${MONTHS[m]} ${y} · ${active.length} partners`} accent={T.navy} />
          <KpiCard label="Revenue / Lead" value={totLeads > 0 ? fmtEur(totRev / totLeads) : "€—"} sub="Weighted avg across partners"               accent={T.blue} />
          <KpiCard label="BC Revenue"     value={fmtEur(totBCRev)}                            sub={`${totBC} BC leads`}                             accent={T.blue2} />
          <KpiCard label="FS Revenue"     value={fmtEur(totFSRev)}                            sub={`${totFS} FS leads`}                             accent={T.blue3} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>
          {/* Partner breakdown table */}
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 13, color: T.text }}>
              Partner Breakdown — {MONTHS[m]} {y}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface2 }}>
                  {["Partner", "Model", "BC Leads", "BC Rev", "FS Leads", "FS Rev", "Total"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: h === "Partner" ? "left" : "right", fontWeight: 700, color: T.muted, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partnerRows.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.surface2}`, opacity: p.active ? 1 : 0.45 }}
                    onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: T.text }}>
                      <span style={{ color: p.active ? T.green : T.muted, marginRight: 6, fontSize: 9 }}>●</span>{p.name}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 20, background: `${MODEL_COLORS[p.model]}18`, color: MODEL_COLORS[p.model], fontSize: 10, fontWeight: 700 }}>{p.model.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: T.muted }}>{p.bcCount || "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: T.navy }}>{p.bcRev > 0 ? fmtEur(p.bcRev) : "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: T.muted }}>{p.fsCount || "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: T.blue }}>{p.fsRev > 0 ? fmtEur(p.fsRev) : "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: T.navy, fontSize: 13 }}>{fmtEur(p.tot)}</td>
                  </tr>
                ))}
                <tr style={{ background: T.surface2 }}>
                  <td colSpan={2} style={{ padding: "10px 14px", color: "#fff", fontWeight: 800 }}>TOTAL</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{totBC || "—"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "#fff", fontWeight: 700 }}>{fmtEur(totBCRev)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{totFS || "—"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "#fff", fontWeight: 700 }}>{fmtEur(totFSRev)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "#fff", fontWeight: 900, fontSize: 15 }}>{fmtEur(totRev)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* 6-month trend */}
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>6-Month Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: T.muted, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} tickFormatter={v => fmtEur(v)} width={55} />
                <Tooltip content={<CustomTooltip formatter={v => fmtEur(v)} />} />
                <Bar dataKey="rev" name="Revenue" radius={[4, 4, 0, 0]}>
                  {trendData.map((d, i) => <Cell key={i} fill={d.label === MONTHS[m].slice(0, 3) ? T.navy : T.blue3} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 12 }}>
              {trendData.map((d, i) => {
                const isActive = d.label === MONTHS[m].slice(0, 3);
                return (
                  <div key={i} style={{ textAlign: "center", padding: "8px 4px", background: isActive ? T.navy : T.surface2, borderRadius: 7 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isActive ? "rgba(255,255,255,0.55)" : T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{d.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? "#fff" : T.navy, marginTop: 2 }}>{d.rev > 0 ? fmtEur(d.rev) : "—"}</div>
                    <div style={{ fontSize: 9, color: T.muted }}>{d.leads > 0 ? `${d.leads}L` : "—"}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </>)}
    </div>
  );
}
