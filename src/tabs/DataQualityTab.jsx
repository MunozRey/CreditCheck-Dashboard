import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';

export default function DataQualityTab({ data }) {
  const { T } = useTheme();
  const bc  = data['Bank Connected']  || [];
  const fs  = data['Form Submitted']  || [];
  const inc = data['Incomplete']      || [];
  const all = [...bc, ...fs, ...inc];

  if (all.length === 0) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: T.muted }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔬</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>No data loaded</div>
        <div style={{ fontSize: 13 }}>Upload an XLSX to run data quality analysis.</div>
      </div>
    );
  }

  const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const validEmails   = all.filter(r => r.email && emailRe.test(r.email));
  const invalidEmails = all.filter(r => !r.email || !emailRe.test(r.email));
  const fullName      = all.filter(r => (r.name || '').trim().split(/\s+/).length >= 2);
  const singleName    = all.filter(r => (r.name || '').trim().split(/\s+/).length < 2);
  const enriched      = all.filter(r => r.income != null);
  const isEnriched    = enriched.length > 0;
  const hasAllFin     = all.filter(r => r.income && r.expenses && r.loanAmount && r.employment);
  const emailVerif    = all.filter(r => r.emailVerified);

  const domainCount = {};
  all.forEach(r => {
    if (!r.email) return;
    const d = r.email.split('@')[1]?.toLowerCase() || 'unknown';
    domainCount[d] = (domainCount[d] || 0) + 1;
  });
  const topDomains = Object.entries(domainCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([domain, count]) => ({ domain, count, pct: Math.round(count / all.length * 100) }));

  const scoreEmail = all.length ? (validEmails.length / all.length) * 40 : 0;
  const scoreName  = all.length ? (fullName.length / all.length) * 20 : 0;
  const scoreVerif = all.length ? (emailVerif.length / all.length) * 25 : 0;
  const scoreFin   = isEnriched && all.length ? (hasAllFin.length / all.length) * 15 : 15;
  const delivScore = Math.round(scoreEmail + scoreName + scoreVerif + scoreFin);
  const scoreColor = delivScore >= 80 ? T.green : delivScore >= 60 ? T.amber : T.red;
  const scoreLabel = delivScore >= 80 ? 'High Quality' : delivScore >= 60 ? 'Moderate' : 'Needs Review';

  const issues = [];
  if (invalidEmails.length > 0)
    issues.push({ level: 'error',   msg: `${invalidEmails.length} invalid email format${invalidEmails.length > 1 ? 's' : ''}`, detail: invalidEmails.slice(0, 3).map(r => r.email).join(', ') });
  if (singleName.length > all.length * 0.2)
    issues.push({ level: 'warning', msg: `${singleName.length} leads with only a first name (no surname)`, detail: `${Math.round(singleName.length / all.length * 100)}% of total — may affect partner matching` });
  if (emailVerif.length < all.length * 0.8)
    issues.push({ level: 'warning', msg: `Only ${emailVerif.length} email-verified leads (${Math.round(emailVerif.length / all.length * 100)}%)`, detail: 'Below 80% threshold — consider filtering unverified before delivery' });
  if (issues.length === 0)
    issues.push({ level: 'ok', msg: 'No critical issues detected', detail: 'Dataset looks clean and ready for partner delivery' });

  const issueColor  = { error: T.red,   warning: T.amber,               ok: T.green };
  const issueIcon   = {
    error:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke={T.red} strokeWidth="1.5"/><line x1="7" y1="4" x2="7" y2="8" stroke={T.red} strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="10.5" r="0.8" fill={T.red}/></svg>,
    warning: <svg width="14" height="13" viewBox="0 0 14 13" fill="none"><path d="M7 1L13 12H1L7 1Z" stroke={T.amber} strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="8" stroke={T.amber} strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.7" fill={T.amber}/></svg>,
    ok:      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke={T.green} strokeWidth="1.5"/><path d="M4 7l2 2 4-4" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  const issueBg     = { error: T.redBg, warning: T.amberBg,             ok: '#F0FDF4' };
  const issueBorder = { error: '#FCA5A5', warning: 'rgba(245,158,11,0.3)', ok: 'rgba(16,185,129,0.3)' };

  const catBreakdown = [
    { label: 'Bank Connected', count: bc.length,  color: T.navy,  pct: Math.round(bc.length  / all.length * 100) },
    { label: 'Form Submitted', count: fs.length,  color: T.blue,  pct: Math.round(fs.length  / all.length * 100) },
    { label: 'Incomplete',     count: inc.length, color: T.amber, pct: Math.round(inc.length / all.length * 100) },
  ];

  const colors = [T.navy, T.blue, T.blue2, T.blue3, '#6366F1', '#8B5CF6', T.amber, T.muted];

  // ── Duplicate detection (group by email, case-insensitive) ──────────────
  const duplicateGroups = useMemo(() => {
    const emailMap = {};
    all.forEach(r => {
      if (!r.email) return;
      const key = r.email.toLowerCase().trim();
      if (!emailMap[key]) emailMap[key] = [];
      const cat = bc.includes(r) ? 'Bank Connected' : fs.includes(r) ? 'Form Submitted' : 'Incomplete';
      emailMap[key].push({ ...r, _cat: cat });
    });
    return Object.entries(emailMap)
      .filter(([, rows]) => rows.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([email, rows]) => ({ email, rows }));
  }, [all, bc, fs, inc]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>Deliverability Score</div>
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke={T.surface2} strokeWidth="12" />
              <circle cx="70" cy="70" r="58" fill="none" stroke={scoreColor} strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 58 * delivScore / 100} ${2 * Math.PI * 58}`}
                strokeLinecap="round" transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{delivScore}</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>/100</div>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{scoreLabel}</div>
          <div style={{ width: '100%', marginTop: 8, display: 'grid', gap: 6 }}>
            {[
              ['Valid emails',    Math.round(validEmails.length / all.length * 100), 40],
              ['Full names',      Math.round(fullName.length / all.length * 100),    20],
              ['Email verified',  Math.round(emailVerif.length / all.length * 100),  25],
              ['Financial data',  isEnriched ? Math.round(hasAllFin.length / all.length * 100) : 100, 15],
            ].map(([label, pct, weight]) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: T.textSub }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 80 ? T.green : pct >= 60 ? T.amber : T.red }}>{pct}% <span style={{ color: T.muted, fontWeight: 400 }}>·{weight}pts</span></span>
                </div>
                <div style={{ height: 4, background: T.surface2, borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? T.green : pct >= 60 ? T.amber : T.red, borderRadius: 4, transition: 'width .6s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <KpiCard label="Total Leads"    value={all.length}                                                          sub="after dedup & filter"           accent={T.navy} />
            <KpiCard label="Valid Emails"   value={`${Math.round(validEmails.length / all.length * 100)}%`}             sub={`${validEmails.length} of ${all.length}`} accent={T.green} />
            <KpiCard label="Full Names"     value={`${Math.round(fullName.length / all.length * 100)}%`}               sub={`${singleName.length} single-name`}       accent={T.blue2} />
            <KpiCard label="Email Verified" value={`${Math.round(emailVerif.length / all.length * 100)}%`}             sub={`${emailVerif.length} confirmed`}         accent={T.blue3} />
          </div>

          <Card style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Issues & Recommendations</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {issues.map((issue, i) => (
                <div key={i} style={{ padding: '10px 14px', background: issueBg[issue.level], border: `1px solid ${issueBorder[issue.level]}`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ lineHeight: 0, flexShrink: 0, marginTop: 1 }}>{issueIcon[issue.level]}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: issueColor[issue.level] }}>{issue.msg}</div>
                    <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{issue.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Category Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {catBreakdown.map(cat => (
                <div key={cat.label} style={{ padding: '12px', background: T.surface2, borderRadius: 8, borderLeft: `3px solid ${cat.color}` }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: cat.color }}>{cat.count}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginTop: 2 }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{cat.pct}% of total</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: '20px' }}>
          <SectionTitle>Email Domain Distribution</SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {topDomains.map((d, i) => (
              <div key={d.domain}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: T.text, fontFamily: 'monospace' }}>@{d.domain}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors[i] }}>{d.count} <span style={{ color: T.muted, fontWeight: 400 }}>({d.pct}%)</span></span>
                </div>
                <div style={{ height: 6, background: T.surface2, borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${d.pct}%`, background: colors[i], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px 12px', background: T.surface2, borderRadius: 6, fontSize: 10, color: T.muted }}>
            {Math.round((domainCount['gmail.com'] || 0) / all.length * 100)}% Gmail · {Math.round(((domainCount['hotmail.com'] || 0) + (domainCount['hotmail.es'] || 0)) / all.length * 100)}% Hotmail · {Math.round(((domainCount['yahoo.es'] || 0) + (domainCount['yahoo.com'] || 0)) / all.length * 100)}% Yahoo
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <SectionTitle>Name Completeness</SectionTitle>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke={T.surface2} strokeWidth="16" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={T.green} strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 40 * fullName.length / Math.max(all.length, 1)} ${2 * Math.PI * 40}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>{Math.round(fullName.length / all.length * 100)}%</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8, flex: 1 }}>
              <div style={{ padding: '10px 14px', background: T.greenBg, borderRadius: 8, borderLeft: `3px solid ${T.green}` }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>{fullName.length}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>Full name (first + surname)</div>
              </div>
              <div style={{ padding: '10px 14px', background: T.amberBg, borderRadius: 8, borderLeft: `3px solid ${T.amber}` }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.amber }}>{singleName.length}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>First name only</div>
              </div>
            </div>
          </div>
          {singleName.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Sample — single name leads</div>
              <div style={{ display: 'grid', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {singleName.slice(0, 8).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: T.surface2, borderRadius: 6, fontSize: 11 }}>
                    <span style={{ fontWeight: 600, color: T.text }}>{r.name || '—'}</span>
                    <span style={{ color: T.muted, fontFamily: 'monospace' }}>{r.email}</span>
                  </div>
                ))}
                {singleName.length > 8 && <div style={{ fontSize: 10, color: T.muted, textAlign: 'center', padding: '4px' }}>+{singleName.length - 8} more</div>}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Duplicate Detection ── */}
      <Card style={{ padding: '20px' }}>
        <SectionTitle>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 1.8, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace" }}>
            Duplicate Detection
          </span>
          {duplicateGroups.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: T.amberBg, color: T.amber, border: `1px solid ${T.amber}30`, fontFamily: "'IBM Plex Mono',monospace" }}>
              {duplicateGroups.length} group{duplicateGroups.length > 1 ? 's' : ''} · {duplicateGroups.reduce((s, g) => s + g.rows.length, 0)} leads
            </span>
          )}
        </SectionTitle>

        {duplicateGroups.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>No duplicates found</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>All email addresses in this dataset are unique.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ padding: '10px 16px', background: T.amberBg, borderRadius: 8, borderLeft: `3px solid ${T.amber}`, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.amber }}>{duplicateGroups.length}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>Duplicate email groups</div>
              </div>
              <div style={{ padding: '10px 16px', background: T.surface2, borderRadius: 8, borderLeft: `3px solid ${T.blue}`, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.blue }}>{duplicateGroups.reduce((s, g) => s + g.rows.length, 0)}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>Total leads with duplicate emails</div>
              </div>
              <div style={{ padding: '10px 16px', background: T.surface2, borderRadius: 8, borderLeft: `3px solid ${T.muted}`, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.textSub }}>{duplicateGroups.reduce((s, g) => s + g.rows.length - 1, 0)}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>Excess records (keep 1 per group)</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {duplicateGroups.slice(0, 20).map((g, i) => {
                const cats = [...new Set(g.rows.map(r => r._cat))];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: T.surface2, borderRadius: 7, borderLeft: `3px solid ${T.amber}` }}>
                    <span style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text, fontFamily: "'IBM Plex Mono',monospace", flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.email}</span>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {cats.map(cat => (
                        <span key={cat} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: "'IBM Plex Mono',monospace",
                          background: cat === 'Bank Connected' ? T.greenBg : cat === 'Form Submitted' ? `${T.blue}15` : T.amberBg,
                          color: cat === 'Bank Connected' ? T.green : cat === 'Form Submitted' ? T.blue : T.amber,
                        }}>{cat === 'Bank Connected' ? 'BC' : cat === 'Form Submitted' ? 'FS' : 'INC'}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, color: T.amber, fontWeight: 700, flexShrink: 0 }}>×{g.rows.length}</span>
                  </div>
                );
              })}
              {duplicateGroups.length > 20 && (
                <div style={{ fontSize: 11, color: T.muted, textAlign: 'center', padding: '8px' }}>+{duplicateGroups.length - 20} more groups not shown</div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
