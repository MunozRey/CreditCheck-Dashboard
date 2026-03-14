import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { scoreLead } from '../utils/scoring.js';
import { toTitleCase } from '../utils/format.js';
import Card from '../components/Card.jsx';
import Avatar from '../components/Avatar.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import LeadDrawer from '../components/LeadDrawer.jsx';

const PRIORITY_LIMIT = 20;

// Returns how many hours ago a date string was
function hoursAgo(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d)) return Infinity;
  return (Date.now() - d.getTime()) / 3600000;
}

// Format days since created
function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export default function PriorityTab({ data }) {
  const { T } = useTheme();
  const [selectedLead, setSelectedLead] = useState(null);
  const [bulkCopied, setBulkCopied] = useState(false);

  // Combine BC + FS only (no Incomplete)
  const qualifiedLeads = useMemo(() => {
    const bc = (data["Bank Connected"] || []).map(r => ({ ...r, cat: "Bank Connected" }));
    const fs = (data["Form Submitted"]  || []).map(r => ({ ...r, cat: "Form Submitted" }));
    return [...bc, ...fs];
  }, [data]);

  // Rank by score descending, take top 20
  const priorityQueue = useMemo(() => {
    return [...qualifiedLeads]
      .map(r => ({ ...r, _score: scoreLead(r) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, PRIORITY_LIMIT);
  }, [qualifiedLeads]);

  const handleBulkCopy = () => {
    const emails = priorityQueue.map(r => r.email).filter(Boolean).join(", ");
    if (!emails) return;
    try {
      navigator.clipboard.writeText(emails);
      setBulkCopied(true);
      setTimeout(() => setBulkCopied(false), 2500);
    } catch(_) {}
  };

  const gradeColor = (s) => s >= 75 ? T.green : s >= 50 ? T.blue : s >= 30 ? T.amber : T.red;
  const gradeLabel = (s) => s >= 75 ? "A" : s >= 50 ? "B" : s >= 30 ? "C" : "D";
  const catColor   = (cat) => cat === "Bank Connected" ? T.green : T.blue;

  const inputStyle = {
    border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px",
    fontSize: 11, color: T.text, outline: "none", background: T.surface2,
    fontFamily: "'Geist',sans-serif",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>Priority Queue</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 3, fontFamily: "'IBM Plex Mono',monospace" }}>
            Top {Math.min(priorityQueue.length, PRIORITY_LIMIT)} leads ranked by score · Bank Connected + Form Submitted only
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
            {qualifiedLeads.length} qualified leads
          </div>
          <button
            onClick={handleBulkCopy}
            disabled={priorityQueue.length === 0}
            title={`Copy all ${priorityQueue.length} emails comma-separated for bulk outreach`}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: `1px solid ${bulkCopied ? T.green : T.border}`,
              background: bulkCopied ? T.green : T.surface,
              color: bulkCopied ? "#fff" : T.textSub,
              fontWeight: 600, fontSize: 11, cursor: priorityQueue.length === 0 ? "not-allowed" : "pointer",
              fontFamily: "'Geist',sans-serif", transition: "all .15s",
              display: "flex", alignItems: "center", gap: 6, opacity: priorityQueue.length === 0 ? 0.5 : 1,
            }}
          >
            {bulkCopied
              ? <><span>✓</span> Emails copied!</>
              : <><svg width="11" height="11" fill="none" viewBox="0 0 12 12"><rect x="1" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 3V2a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> Copy {priorityQueue.length} emails</>
            }
          </button>
        </div>
      </div>

      {/* Empty state */}
      {priorityQueue.length === 0 && (
        <Card style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginBottom: 6 }}>No qualified leads</div>
          <div style={{ fontSize: 12, color: T.muted }}>Upload data with Bank Connected or Form Submitted leads to see the priority queue.</div>
        </Card>
      )}

      {/* Priority table */}
      {priorityQueue.length > 0 && (
        <Card style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface2 }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, width: 44, whiteSpace: "nowrap" }}>#</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>Name</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, minWidth: 160 }}>Score</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>Category</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>Income</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>Loan</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>Created</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {priorityQueue.map((row, i) => {
                  const score   = row._score;
                  const grade   = gradeLabel(score);
                  const gColor  = gradeColor(score);
                  const cc      = catColor(row.cat);
                  const hrs     = hoursAgo(row.created);
                  const isNew   = hrs <= 48;
                  const days    = daysSince(row.created);
                  const daysLabel = days === null ? "—" : days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;

                  return (
                    <tr
                      key={row.email || `pq-${i}`}
                      onClick={() => setSelectedLead(row)}
                      style={{ borderBottom: `1px solid ${T.surface2}`, cursor: "pointer", transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Rank */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 26, height: 26, borderRadius: 6,
                          background: i < 3 ? `${T.blue}15` : T.surface2,
                          border: `1px solid ${i < 3 ? `${T.blue}30` : T.border}`,
                          fontSize: 11, fontWeight: 800,
                          color: i < 3 ? T.blue : T.muted,
                          fontFamily: "'IBM Plex Mono',monospace",
                        }}>
                          {i + 1}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={toTitleCase(row.name)} />
                          <div>
                            <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{row.name ? toTitleCase(row.name) : "—"}</div>
                            {row.email && (
                              <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{row.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Score bar */}
                      <td style={{ padding: "11px 14px", minWidth: 160 }}>
                        <ScoreBar score={score} />
                      </td>

                      {/* Category */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                          background: `${cc}15`, color: cc, border: `1px solid ${cc}30`,
                          fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap",
                        }}>
                          {row.cat === "Bank Connected" ? "BC" : "FS"}
                        </span>
                      </td>

                      {/* Income */}
                      <td style={{ padding: "11px 14px", textAlign: "right", color: T.navy, fontWeight: 600, fontSize: 11, fontVariantNumeric: "tabular-nums", fontFamily: "'IBM Plex Mono',monospace" }}>
                        {row.income ? `€${Number(row.income).toLocaleString()}` : "—"}
                      </td>

                      {/* Loan */}
                      <td style={{ padding: "11px 14px", textAlign: "right", color: T.textSub, fontSize: 11, fontVariantNumeric: "tabular-nums", fontFamily: "'IBM Plex Mono',monospace" }}>
                        {row.loanAmount ? `€${Number(row.loanAmount).toLocaleString()}` : "—"}
                      </td>

                      {/* Days since created */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 11, color: isNew ? T.green : T.muted, fontFamily: "'IBM Plex Mono',monospace", fontWeight: isNew ? 700 : 400 }}>
                          {daysLabel}
                        </span>
                      </td>

                      {/* Contact today badge */}
                      <td style={{ padding: "11px 14px", textAlign: "center" }}>
                        {isNew ? (
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
                            background: `${T.green}15`, color: T.green, border: `1px solid ${T.green}30`,
                            fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.8, textTransform: "uppercase", whiteSpace: "nowrap",
                          }}>
                            Contact today
                          </span>
                        ) : (
                          <span style={{ color: T.border, fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, background: T.surface2, display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
              Showing top {priorityQueue.length} of {qualifiedLeads.length} qualified leads
            </span>
            <span style={{ fontSize: 10, color: T.green, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>
              {priorityQueue.filter(r => hoursAgo(r.created) <= 48).length} need contact today
            </span>
            {priorityQueue.length > 0 && (
              <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
                Avg score: {Math.round(priorityQueue.reduce((s, r) => s + r._score, 0) / priorityQueue.length)}
              </span>
            )}
          </div>
        </Card>
      )}

      {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
