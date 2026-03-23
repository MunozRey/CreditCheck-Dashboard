import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import { COUNTRY_META } from '../constants/countries.js';
import { fmtK } from '../utils/format.js';

export default function CountriesTab({ data }) {
  const { T } = useTheme();
  const bc  = data['Bank Connected']  || [];
  const fs  = data['Form Submitted']  || [];
  const all = [...bc, ...fs];

  // ── Empty state ────────────────────────────────────────────────────────────
  if (all.length === 0) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", gap:16, textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:16, background:T.surface2, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🌍</div>
        <div style={{ fontSize:18, fontWeight:700, color:T.text, fontFamily:"'Playfair Display',serif", letterSpacing:-0.3 }}>No country data yet</div>
        <div style={{ fontSize:13, color:T.muted, maxWidth:380, lineHeight:1.6 }}>
          Once leads are loaded, this tab shows per-country BC rates, average income, loan demand, and top loan purposes.
        </div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {[["🇪🇸","Spain"],["🇵🇹","Portugal"],["🇫🇷","France"],["🇮🇹","Italy"],["🇩🇪","Germany"]].map(([flag,label])=>(
            <div key={label} style={{ padding:"10px 14px", borderRadius:10, border:`1px dashed ${T.border}`, background:T.surface2, textAlign:"center", opacity:0.5 }}>
              <div style={{ fontSize:22 }}>{flag}</div>
              <div style={{ fontSize:10, fontWeight:600, color:T.muted, marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isEnriched = all.some(r => r.income != null);

  const countryStats = {};
  all.forEach(r => {
    const c = r.country || 'unknown';
    if (!countryStats[c]) countryStats[c] = { total: 0, bc: 0, fs: 0, incomes: [], loans: [] };
    countryStats[c].total++;
    if (bc.includes(r)) countryStats[c].bc++;
    if (fs.includes(r)) countryStats[c].fs++;
    if (r.income)     countryStats[c].incomes.push(r.income);
    if (r.loanAmount) countryStats[c].loans.push(r.loanAmount);
  });

  const sorted = Object.entries(countryStats).sort((a, b) => b[1].total - a[1].total);
  const [active, setActive] = useState(sorted[0]?.[0] || 'es');
  const activeStat = countryStats[active] || {};
  const activeMeta = COUNTRY_META[active] || { flag: '🌍', label: active, color: T.navy };
  const avgInc  = activeStat.incomes?.length ? Math.round(activeStat.incomes.reduce((s, v) => s + v, 0) / activeStat.incomes.length) : null;
  const avgLoan = activeStat.loans?.length   ? Math.round(activeStat.loans.reduce((s, v)   => s + v, 0) / activeStat.loans.length)   : null;
  const bcRate  = activeStat.total > 0 ? Math.round(activeStat.bc / activeStat.total * 100) : 0;

  const activeLeads = all.filter(r => (r.country || 'unknown') === active);
  const purposeCount = {};
  activeLeads.forEach(r => { if (r.purpose) purposeCount[r.purpose] = (purposeCount[r.purpose] || 0) + 1; });
  const topPurposes = Object.entries(purposeCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const hasData = all.some(r => r.country);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
        {sorted.map(([code, stat]) => {
          const meta  = COUNTRY_META[code] || { flag: '🌍', label: code, color: T.navy };
          const isAct = active === code;
          const rate  = stat.total > 0 ? Math.round(stat.bc / stat.total * 100) : 0;
          return (
            <button key={code} onClick={() => setActive(code)} style={{
              textAlign: 'left', padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
              background: isAct ? meta.color + '22' : T.surface2,
              border: `1.5px solid ${isAct ? meta.color : T.border}`,
              transition: 'all .15s',
              boxShadow: isAct ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{meta.flag}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: isAct ? '#fff' : T.text, marginBottom: 1 }}>{meta.label}</div>
              <div style={{ fontSize: 9, color: isAct ? 'rgba(255,255,255,0.6)' : T.muted, fontStyle: 'italic', marginBottom: 4 }}>{meta.lang}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{stat.total} leads</span>
                <span style={{ width: 1, height: 10, background: isAct ? 'rgba(255,255,255,0.3)' : T.border, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: T.muted }}>{rate}% BC</span>
              </div>
            </button>
          );
        })}

        {Object.entries(COUNTRY_META)
          .filter(([code]) => !countryStats[code])
          .map(([code, meta]) => (
            <div key={code} style={{ padding: '14px 16px', borderRadius: 10, background: T.surface, border: `2px dashed ${T.border}`, opacity: 0.5 }}>
              <div style={{ fontSize: 22, marginBottom: 6, filter: 'grayscale(0.5)' }}>{meta.flag}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 2 }}>{meta.label}</div>
              <div style={{ fontSize: 10, color: T.muted, fontStyle: 'italic' }}>{meta.lang}</div>
              <div style={{ fontSize: 10, color: T.border, marginTop: 6 }}>No leads yet</div>
            </div>
          ))}
      </div>

      {hasData && activeStat.total > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            <KpiCard label="Total Leads"    value={activeStat.total}                                    sub={`${activeMeta.flag} ${activeMeta.label}`}                                         accent={activeMeta.color} />
            <KpiCard label="Bank Connected" value={activeStat.bc}                                       sub={`${bcRate}% BC rate`}                                                             accent={T.blue} />
            <KpiCard label="Form Submitted" value={activeStat.fs}                                       sub="Pending OB connection"                                                            accent={T.blue2} />
            <KpiCard label="Avg Loan"       value={isEnriched && avgLoan ? fmtK(avgLoan) : '—'}        sub={isEnriched && avgInc ? `Avg income ${fmtK(avgInc)}` : 'Upload enriched data'}     accent={T.blue3} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <SectionTitle>Loan Purpose — {activeMeta.label}</SectionTitle>
              {topPurposes.length > 0 ? topPurposes.map(([purpose, count]) => (
                <div key={purpose} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textSub, textTransform: 'capitalize' }}>{purpose.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: activeMeta.color }}>{count} · {activeLeads.length > 0 ? Math.round(count / activeLeads.length * 100) : 0}%</span>
                  </div>
                  <div style={{ height: 5, background: T.surface2, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${activeLeads.length > 0 ? Math.round(count / activeLeads.length * 100) : 0}%`, background: activeMeta.color, borderRadius: 3, transition: 'width .4s' }} />
                  </div>
                </div>
              )) : <div style={{ color: T.muted, fontSize: 12 }}>No purpose data</div>}
            </Card>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 12, color: T.text }}>All Markets — Overview</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.surface2 }}>
                    {['Country', 'Leads', 'BC', 'BC%', 'Avg Loan'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: h === 'Country' ? 'left' : 'right', fontWeight: 700, color: T.muted, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(([code, stat]) => {
                    const meta  = COUNTRY_META[code] || { flag: '🌍', label: code, color: T.navy };
                    const rate  = stat.total > 0 ? Math.round(stat.bc / stat.total * 100) : 0;
                    const avg   = stat.loans.length ? Math.round(stat.loans.reduce((s, v) => s + v, 0) / stat.loans.length) : null;
                    const isAct = active === code;
                    return (
                      <tr key={code} onClick={() => setActive(code)}
                        style={{ borderBottom: `1px solid ${T.surface2}`, cursor: 'pointer', background: isAct ? `${meta.color}0D` : 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${meta.color}0D`}
                        onMouseLeave={e => e.currentTarget.style.background = isAct ? `${meta.color}0D` : 'transparent'}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{meta.flag} {meta.label}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: T.muted }}>{stat.total}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: T.muted }}>{stat.bc}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: rate >= 30 ? T.green : T.amber }}>{rate}%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: T.muted }}>{avg && isEnriched ? fmtK(avg) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
