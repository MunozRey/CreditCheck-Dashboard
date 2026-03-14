import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTheme, getModelColors } from '../context/ThemeContext.jsx';
import { calcRev, MONTHS, monthKey, todayYM, newPartner } from '../utils/revenue.js';
import { fmtEur, fmtNum } from '../utils/format.js';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import MonthNav from '../components/MonthNav.jsx';
import PreciseInput from '../components/PreciseInput.jsx';
import CustomTooltip from '../components/CustomTooltip.jsx';

export default function MultiPartnerTab({ partners, setPartners, monthData, setMonthData }) {
  const { T } = useTheme();
  const MODEL_COLORS = getModelColors(T);

  const { y: ty, m: tm } = todayYM();
  const [y, setY]           = useState(ty);
  const [m, setM]           = useState(tm);
  const [search, setSearch] = useState("");

  const key     = monthKey(y, m);
  const prevKey = m === 0 ? monthKey(y - 1, 11) : monthKey(y, m - 1);

  const curMonth = monthData[key] || {};
  const getEntry = (pid) => curMonth[pid] || { bcCount: 0, fsCount: 0, note: "" };

  const updEntry = (pid, patch) => setMonthData(prev => ({
    ...prev,
    [key]: { ...(prev[key] || {}), [pid]: { ...getEntry(pid), ...patch } }
  }));

  const copyPrev = () => {
    const prev = monthData[prevKey];
    if (!prev) return;
    setMonthData(md => ({
      ...md,
      [key]: Object.fromEntries(
        Object.entries(prev).map(([pid, e]) => [pid, { ...e, bcCount: 0, fsCount: 0, note: "" }])
      )
    }));
  };

  const addPartner    = () => setPartners(ps => [...ps, newPartner(`Partner ${ps.length + 1}`)]);
  const removePartner = (id) => setPartners(ps => ps.filter(p => p.id !== id));
  const updPartner    = (id, patch) => setPartners(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));

  const hasPrev  = !!monthData[prevKey];
  const MODELS   = [{ id: "cpl", label: "CPL" }, { id: "cpa", label: "CPA" }, { id: "hybrid", label: "Hybrid" }];
  const filtered = partners.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const active   = partners.filter(p => p.active);

  const totRev   = active.reduce((s, p) => { const e = getEntry(p.id); return s + calcRev(p.model, e.bcCount, p.bcS) + calcRev(p.model, e.fsCount, p.fsS); }, 0);
  const totLeads = active.reduce((s, p) => { const e = getEntry(p.id); return s + e.bcCount + e.fsCount; }, 0);
  const totBC    = active.reduce((s, p) => s + getEntry(p.id).bcCount, 0);

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const mm  = m - 5 + i, yy = y + Math.floor(mm / 12), mm2 = ((mm % 12) + 12) % 12;
    const k   = monthKey(yy, mm2), md = monthData[k] || {};
    const rev = active.reduce((s, p) => { const e = md[p.id] || { bcCount: 0, fsCount: 0 }; return s + calcRev(p.model, e.bcCount, p.bcS) + calcRev(p.model, e.fsCount, p.fsS); }, 0);
    const leads = active.reduce((s, p) => { const e = md[p.id] || { bcCount: 0, fsCount: 0 }; return s + e.bcCount + e.fsCount; }, 0);
    return { label: MONTHS[mm2].slice(0, 3), rev, leads };
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <MonthNav y={y} m={m} onChange={(ny, nm) => { setY(ny); setM(nm); }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="Search partners…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 12px", fontSize: 11, width: 160, outline: "none", color: T.text, background: T.surface2, fontFamily: "'Geist',sans-serif" }}
          />
          {hasPrev && (
            <button onClick={copyPrev} style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Geist',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>⎘</span> Copy from {MONTHS[m === 0 ? 11 : m - 1]}
            </button>
          )}
          <button onClick={addPartner} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: T.navy, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'Geist',sans-serif" }}>
            + Partner
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KpiCard label="Total Revenue"    value={totRev > 0 ? fmtEur(totRev) : "€—"}              sub={`${active.length} active · ${MONTHS[m]}`} accent={T.navy} />
        <KpiCard label="Revenue / Lead"   value={totLeads > 0 ? fmtEur(totRev / totLeads) : "€—"} sub="Weighted avg"                             accent={T.blue} />
        <KpiCard label="Leads this month" value={totLeads > 0 ? fmtNum(totLeads) : "—"}            sub={`${totBC} BC · ${totLeads - totBC} FS`}   accent={T.blue2} />
        <KpiCard label="Partners"         value={partners.length}                                   sub={`${active.length} active`}                accent={T.blue3} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        {/* Partner rows */}
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map(p => {
            const e     = getEntry(p.id);
            const bcRev = calcRev(p.model, e.bcCount, p.bcS);
            const fsRev = calcRev(p.model, e.fsCount, p.fsS);
            const tot   = bcRev + fsRev;

            return (
              <Card key={p.id} style={{ overflow: "hidden", opacity: p.active ? 1 : 0.5, transition: "opacity .2s" }}>
                {/* Partner header */}
                <div style={{ padding: "10px 16px", background: p.active ? T.navy : T.muted, display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    value={p.name}
                    onChange={e => updPartner(p.id, { name: e.target.value })}
                    style={{ background: "transparent", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, outline: "none", flex: 1, fontFamily: "'Geist',sans-serif" }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{tot > 0 ? fmtEur(tot) : "€—"}</span>
                  <select
                    value={p.model}
                    onChange={e => updPartner(p.id, { model: e.target.value })}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 6px", cursor: "pointer", fontFamily: "'Geist',sans-serif", outline: "none" }}
                  >
                    {MODELS.map(mo => <option key={mo.id} value={mo.id} style={{ background: T.surface2 }}>{mo.label}</option>)}
                  </select>
                  <button onClick={() => updPartner(p.id, { active: !p.active })} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, padding: "3px 10px", color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "'Geist',sans-serif", whiteSpace: "nowrap" }}>
                    {p.active ? "● Active" : "○ Paused"}
                  </button>
                  <button onClick={() => removePartner(p.id)} style={{ background: "rgba(220,38,38,0.4)", border: "none", borderRadius: 6, padding: "3px 8px", color: "#fff", cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>

                {/* Monthly entry */}
                <div style={{ padding: "12px 16px", display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* BC */}
                    <div style={{ padding: 12, background: T.surface2, borderRadius: 8, borderTop: `2px solid ${T.navy}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>BC Leads</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <PreciseInput value={e.bcCount} onChange={v => updEntry(p.id, { bcCount: v })} color={T.navy} width={60} />
                        <span style={{ fontSize: 11, color: T.muted }}>leads</span>
                      </div>
                      {(p.model === "cpl" || p.model === "hybrid") && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>CPL/lead</span>
                          <PreciseInput value={p.bcS.cplRate} onChange={v => updPartner(p.id, { bcS: { ...p.bcS, cplRate: v } })} prefix="€" color={T.navy} width={65} />
                        </div>
                      )}
                      {(p.model === "cpa" || p.model === "hybrid") && (<>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>Conv. %</span>
                          <PreciseInput value={p.bcS.convRate} onChange={v => updPartner(p.id, { bcS: { ...p.bcS, convRate: v } })} suffix="%" color={T.navy} width={60} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>Ticket</span>
                          <PreciseInput value={p.bcS.ticket} onChange={v => updPartner(p.id, { bcS: { ...p.bcS, ticket: v } })} prefix="€" color={T.navy} width={80} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>Commission</span>
                          <PreciseInput value={p.bcS.commission} onChange={v => updPartner(p.id, { bcS: { ...p.bcS, commission: v } })} suffix="%" color={T.navy} width={60} />
                        </div>
                      </>)}
                      <div style={{ marginTop: 6, fontWeight: 800, color: T.navy, fontSize: 14 }}>{fmtEur(bcRev)}</div>
                    </div>

                    {/* FS */}
                    <div style={{ padding: 12, background: T.surface2, borderRadius: 8, borderTop: `2px solid ${T.blue}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>FS Leads</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <PreciseInput value={e.fsCount} onChange={v => updEntry(p.id, { fsCount: v })} color={T.blue} width={60} />
                        <span style={{ fontSize: 11, color: T.muted }}>leads</span>
                      </div>
                      {(p.model === "cpl" || p.model === "hybrid") && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>CPL/lead</span>
                          <PreciseInput value={p.fsS.cplRate} onChange={v => updPartner(p.id, { fsS: { ...p.fsS, cplRate: v } })} prefix="€" color={T.blue} width={65} />
                        </div>
                      )}
                      {(p.model === "cpa" || p.model === "hybrid") && (<>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>Conv. %</span>
                          <PreciseInput value={p.fsS.convRate} onChange={v => updPartner(p.id, { fsS: { ...p.fsS, convRate: v } })} suffix="%" color={T.blue} width={60} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>Ticket</span>
                          <PreciseInput value={p.fsS.ticket} onChange={v => updPartner(p.id, { fsS: { ...p.fsS, ticket: v } })} prefix="€" color={T.blue} width={80} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: T.muted, width: 70 }}>Commission</span>
                          <PreciseInput value={p.fsS.commission} onChange={v => updPartner(p.id, { fsS: { ...p.fsS, commission: v } })} suffix="%" color={T.blue} width={60} />
                        </div>
                      </>)}
                      <div style={{ marginTop: 6, fontWeight: 800, color: T.blue, fontSize: 14 }}>{fmtEur(fsRev)}</div>
                    </div>
                  </div>

                  {/* Note + total */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Note</div>
                      <input
                        value={e.note}
                        onChange={ev => updEntry(p.id, { note: ev.target.value })}
                        placeholder="Deal notes…"
                        style={{ width: "100%", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: T.text, outline: "none", background: T.surface2, fontFamily: "'Geist',sans-serif", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ textAlign: "right", padding: "10px 16px", background: T.navy, borderRadius: 8, minWidth: 100 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.8 }}>Total</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{fmtEur(tot)}</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card style={{ padding: 32, textAlign: "center" }}>
              <div style={{ color: T.muted, fontSize: 13 }}>{search ? "No partners match your search" : "No partners yet — add one above"}</div>
            </Card>
          )}
        </div>

        {/* Right panel: summary + trend */}
        <div style={{ display: "grid", gap: 12 }}>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 12, color: T.text }}>
              {MONTHS[m]} {y} — Summary
            </div>
            <div style={{ overflowY: "auto", maxHeight: 320 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.surface2 }}>
                    {["Partner", "Leads", "Revenue"].map(h => (
                      <th key={h} style={{ padding: "7px 12px", textAlign: h === "Partner" ? "left" : "right", fontWeight: 700, color: T.muted, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partners.map(p => {
                    const e     = getEntry(p.id);
                    const rev   = calcRev(p.model, e.bcCount, p.bcS) + calcRev(p.model, e.fsCount, p.fsS);
                    const leads = e.bcCount + e.fsCount;
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.surface2}`, opacity: p.active ? 1 : 0.45 }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: T.text, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ color: p.active ? T.green : T.muted, marginRight: 5, fontSize: 8 }}>●</span>{p.name}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: T.muted }}>{leads > 0 ? leads : "—"}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: rev > 0 ? T.navy : T.muted }}>{rev > 0 ? fmtEur(rev) : "—"}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: T.surface2 }}>
                    <td style={{ padding: "8px 12px", color: "#fff", fontWeight: 800, fontSize: 11 }}>TOTAL</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#fff", fontWeight: 700 }}>{totLeads > 0 ? totLeads : "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#fff", fontWeight: 800 }}>{fmtEur(totRev)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>6-Month Trend</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={v => fmtEur(v)} />} />
                <Bar dataKey="rev" name="Revenue" radius={[3, 3, 0, 0]}>
                  {trendData.map((d, i) => <Cell key={i} fill={d.label === MONTHS[m].slice(0, 3) ? T.navy : T.blue3} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
