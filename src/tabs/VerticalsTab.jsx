import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { VERTICALS_DEF, applyVehicleFilter } from '../constants/verticals.js';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';

export default function VerticalsTab({ data }) {
  const { T } = useTheme();
  const [activeV, setActiveV] = useState("personal_loans");

  const bc  = data["Bank Connected"]  || [];
  const fs  = data["Form Submitted"]  || [];
  const all = [...bc, ...fs];
  const isEnriched = all.some(r => r.income != null);

  const V        = VERTICALS_DEF[activeV];
  const baseLeads = all.filter(r => V.purposes.includes(r.purpose));
  const baseBC    = bc.filter(r  => V.purposes.includes(r.purpose));
  const baseFS    = fs.filter(r  => V.purposes.includes(r.purpose));
  const vLeads   = applyVehicleFilter(baseLeads, V.vehicleFilter);
  const vBC      = applyVehicleFilter(baseBC,    V.vehicleFilter);
  const vFS      = applyVehicleFilter(baseFS,    V.vehicleFilter);
  const vRate    = vLeads.length > 0 ? Math.round(vBC.length / vLeads.length * 100) : 0;

  const incomes   = vLeads.map(r => r.income).filter(Boolean);
  const loans     = vLeads.map(r => r.loanAmount).filter(Boolean);
  const ages      = vLeads.map(r => r.age).filter(Boolean);
  const avgInc    = incomes.length ? Math.round(incomes.reduce((s, v) => s + v, 0) / incomes.length) : null;
  const avgLoan   = loans.length   ? Math.round(loans.reduce((s, v) => s + v, 0) / loans.length) : null;
  const avgAge    = ages.length    ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : null;
  const highValue = vBC.filter(r => (r.income || 0) > 2000 && (r.loanAmount || 0) > 5000);

  const empCount = {}; vLeads.forEach(r => { if (r.employment) { const e = r.employment.replace(/_/g, " "); empCount[e] = (empCount[e] || 0) + 1; } });
  const topEmp   = Object.entries(empCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const resCount = {}; vLeads.forEach(r => { if (r.residential) { const e = r.residential.replace(/_/g, " "); resCount[e] = (resCount[e] || 0) + 1; } });
  const topRes   = Object.entries(resCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const dti = { h: 0, m: 0, hi: 0 };
  vLeads.forEach(r => {
    if (r.income && r.expenses && r.income > 0) {
      const ratio = r.expenses / r.income;
      if (ratio < 0.3) dti.h++; else if (ratio < 0.5) dti.m++; else dti.hi++;
    }
  });

  const fmtK = n => n >= 1000 ? `€${(n / 1000).toFixed(0)}k` : `€${n}`;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Vertical Selector Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {Object.values(VERTICALS_DEF).map(v => {
          const base = [...bc, ...fs].filter(r => v.purposes.includes(r.purpose));
          const bBC  = bc.filter(r => v.purposes.includes(r.purpose));
          const vl   = applyVehicleFilter(base, v.vehicleFilter);
          const vb   = applyVehicleFilter(bBC,  v.vehicleFilter);
          const active = activeV === v.id;
          return (
            <button key={v.id} onClick={() => setActiveV(v.id)} style={{
              textAlign: "left", padding: "16px 18px", borderRadius: 12, cursor: "pointer",
              background: active ? v.color : T.surface,
              border: `2px solid ${active ? v.color : T.border}`,
              transition: "all .15s", boxShadow: active ? "0 4px 16px rgba(0,0,0,0.15)" : "none",
            }}>
              <div style={{ fontSize: 20, marginBottom: 7 }}>{v.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: active ? "#fff" : T.text, letterSpacing: -0.2 }}>{v.label}</div>
              <div style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.6)" : T.muted, margin: "3px 0 10px", lineHeight: 1.4 }}>{v.desc}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: active ? "#fff" : v.color }}>{vl.length} leads</span>
                <span style={{ width: 1, height: 10, background: active ? "rgba(255,255,255,0.3)" : T.border, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? "rgba(255,255,255,0.75)" : T.muted }}>
                  {vl.length > 0 ? Math.round(vb.length / vl.length * 100) : 0}% BC
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Heuristic notice for vehicle sub-verticals */}
      {V.vehicleFilter && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 16px",
          background: V.vehicleFilter === "secured" ? T.redBg : T.amberBg,
          border: `1px solid ${V.vehicleFilter === "secured" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.4)"}`,
          borderRadius: 8, fontSize: 11,
          color: V.vehicleFilter === "secured" ? "#9F1239" : "#78350F",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div style={{ lineHeight: 1.6 }}>
            <strong>Heuristic segmentation — no explicit field in source data.</strong>{" "}
            {V.vehicleFilter === "unsecured"
              ? "Leads classified as unsecured personal credit based on loan ≤€15k AND term ≤60 months. The vehicle is the stated purchase destination, not the collateral. Underwriting is based on income and DTI."
              : "Leads classified as vehicle-secured based on loan >€15k OR term >60 months — amounts/terms that are not viable as unsecured personal credit at these income levels. Partner must have vehicle valuation and collateral registration capability (reserva de dominio / prenda sin desplazamiento)."}
          </div>
        </div>
      )}

      {vLeads.length === 0 ? (
        <Card style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{V.icon}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>No leads in this vertical</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>Upload a XLSX with loan purpose data</div>
        </Card>
      ) : (<>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <KpiCard label="Total Leads"    value={vLeads.length}                    sub={`${V.label} vertical`}       accent={V.color} />
          <KpiCard label="Bank Connected" value={vBC.length}                       sub={`${vRate}% BC rate`}          accent={T.blue} />
          <KpiCard label="Form Submitted" value={vFS.length}                       sub="Pending OB connection"        accent={T.blue2} />
          <KpiCard label="High Value"     value={isEnriched ? highValue.length : "—"} sub="BC · income>2k · loan>5k" accent={T.green} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Financial profile */}
          {isEnriched && (
            <Card style={{ padding: 20 }}>
              <SectionTitle>Financial Profile</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Avg Monthly Income", val: avgInc  ? fmtK(avgInc)  : "—", color: V.color },
                  { label: "Avg Loan Request",   val: avgLoan ? fmtK(avgLoan) : "—", color: T.blue2 },
                  { label: "Avg Age",             val: avgAge  ? `${avgAge} yrs` : "—", color: T.navy },
                  { label: "High Value",          val: isEnriched ? highValue.length : "—", color: T.green },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ padding: "12px 14px", background: T.surface2, borderRadius: 8, borderTop: `2px solid ${color}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color }}>{val}</div>
                  </div>
                ))}
              </div>
              {/* DTI */}
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Debt-to-Income Risk</div>
              {[["Solvent <30%", dti.h, T.green], ["Acceptable 30–40%", dti.m, T.amber], ["High/Excl. >40%", dti.hi, T.red]].map(([label, n, color]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: T.textSub }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{n} · {vLeads.length > 0 ? Math.round(n / vLeads.length * 100) : 0}%</span>
                  </div>
                  <div style={{ height: 5, background: T.surface2, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${vLeads.length > 0 ? Math.round(n / vLeads.length * 100) : 0}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {topEmp.length > 0 && (
            <Card style={{ padding: 20 }}>
              <SectionTitle>Employment Breakdown</SectionTitle>
              {topEmp.map(([label, count]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textSub, textTransform: "capitalize" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: V.color }}>{count} · {vLeads.length > 0 ? Math.round(count / vLeads.length * 100) : 0}%</span>
                  </div>
                  <div style={{ height: 5, background: T.surface2, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${vLeads.length > 0 ? Math.round(count / vLeads.length * 100) : 0}%`, background: V.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </Card>
          )}
          {topRes.length > 0 && (
            <Card style={{ padding: 20 }}>
              <SectionTitle>Residential Status</SectionTitle>
              {topRes.map(([label, count]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textSub, textTransform: "capitalize" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.blue2 }}>{count} · {vLeads.length > 0 ? Math.round(count / vLeads.length * 100) : 0}%</span>
                  </div>
                  <div style={{ height: 5, background: T.surface2, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${vLeads.length > 0 ? Math.round(count / vLeads.length * 100) : 0}%`, background: T.blue2, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </>)}
    </div>
  );
}
