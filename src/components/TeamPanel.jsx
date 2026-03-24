/**
 * TeamPanel.jsx — Clovr Labs
 * Admin-only panel for managing team members who can access the dashboard.
 * Opens as a floating modal, similar to SettingsPanel.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { listUsers, addUser, updateUserRole, removeUser } from "../api/usersApi.js";

const ROLE_LABELS = { admin: "Admin", viewer: "Viewer" };
const ROLE_COLORS = { admin: "#6366f1", viewer: "#64748b" };

export default function TeamPanel({ onClose, currentUserRole }) {
  const { T } = useTheme();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole,  setNewRole]  = useState("viewer");
  const [adding,   setAdding]   = useState(false);
  const [addError, setAddError] = useState(null);

  const isAdmin = currentUserRole === "admin";

  // ── Load users ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers();
      if (res?.data) setUsers(res.data);
      else setError("Could not load team members.");
    } catch (e) {
      setError(e.message || "Error loading users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Close on Escape ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Add user ────────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await addUser(newEmail.trim().toLowerCase(), newRole);
      setNewEmail("");
      setNewRole("viewer");
      await load();
    } catch (e) {
      setAddError(e.message || "Could not add user.");
    } finally {
      setAdding(false);
    }
  };

  // ── Toggle role ─────────────────────────────────────────────────────────────
  const handleRoleToggle = async (user) => {
    const next = user.role === "admin" ? "viewer" : "admin";
    try {
      await updateUserRole(user.id, next);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: next } : u));
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Remove ──────────────────────────────────────────────────────────────────
  const handleRemove = async (user) => {
    if (!window.confirm(`Remove ${user.email} from the team?`)) return;
    try {
      await removeUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Styles (inline to match the rest of the app) ────────────────────────────
  const overlay = {
    position: "fixed", inset: 0, zIndex: 9000,
    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const panel = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
    width: "100%", maxWidth: 520, maxHeight: "85vh",
    display: "flex", flexDirection: "column", overflow: "hidden",
  };
  const header = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}`,
  };
  const body = { padding: "16px 20px", overflowY: "auto", flex: 1 };
  const inputStyle = {
    flex: 1, padding: "8px 10px", borderRadius: 7, fontSize: 12,
    border: `1px solid ${T.border}`, background: T.surface2,
    color: T.text, outline: "none",
  };
  const btnPrimary = {
    padding: "8px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
    background: T.blue, color: "#fff", border: "none", cursor: "pointer",
    opacity: adding ? 0.6 : 1,
  };
  const selectStyle = {
    padding: "8px 10px", borderRadius: 7, fontSize: 12,
    border: `1px solid ${T.border}`, background: T.surface2,
    color: T.text, cursor: "pointer",
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panel}>

        {/* Header */}
        <div style={header}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Team Access</div>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>
              Manage who can log in to the dashboard
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: T.muted, padding: "2px 6px", borderRadius: 6,
          }}>✕</button>
        </div>

        <div style={body}>

          {/* Add user form — admin only */}
          {isAdmin && (
            <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 9, fontWeight: 800, color: T.muted,
                letterSpacing: 1.4, textTransform: "uppercase",
                marginBottom: 10, paddingBottom: 4, borderBottom: `1px solid ${T.border}`,
              }}>
                Invite teammate
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="email"
                  placeholder="colleague@clovrlabs.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={inputStyle}
                  required
                  disabled={adding}
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={selectStyle}
                  disabled={adding}
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" style={btnPrimary} disabled={adding}>
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>
              {addError && (
                <div style={{ fontSize: 11, color: T.red, marginTop: 6 }}>{addError}</div>
              )}
            </form>
          )}

          {/* User list */}
          <div style={{
            fontSize: 9, fontWeight: 800, color: T.muted,
            letterSpacing: 1.4, textTransform: "uppercase",
            marginBottom: 10, paddingBottom: 4, borderBottom: `1px solid ${T.border}`,
          }}>
            {users.length} team member{users.length !== 1 ? "s" : ""}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: 32, color: T.muted, fontSize: 12 }}>
              Loading…
            </div>
          )}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, background: T.red + "18",
              color: T.red, fontSize: 12, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {!loading && users.map((user) => (
            <div key={user.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", borderBottom: `1px solid ${T.surface3}`,
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: T.blue + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: T.blue,
              }}>
                {user.email[0].toUpperCase()}
              </div>

              {/* Email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: T.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {user.email}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
                  Added {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Role badge / toggle */}
              {isAdmin ? (
                <button
                  title={`Click to toggle role`}
                  onClick={() => handleRoleToggle(user)}
                  style={{
                    padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: ROLE_COLORS[user.role] + "22",
                    color: ROLE_COLORS[user.role],
                    border: `1px solid ${ROLE_COLORS[user.role]}44`,
                    cursor: "pointer",
                  }}
                >
                  {ROLE_LABELS[user.role]}
                </button>
              ) : (
                <span style={{
                  padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: ROLE_COLORS[user.role] + "22",
                  color: ROLE_COLORS[user.role],
                }}>
                  {ROLE_LABELS[user.role]}
                </span>
              )}

              {/* Remove */}
              {isAdmin && (
                <button
                  onClick={() => handleRemove(user)}
                  title="Remove from team"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: T.muted, fontSize: 14, padding: "2px 4px",
                    borderRadius: 4, lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Footer note */}
          {!isAdmin && (
            <div style={{ fontSize: 11, color: T.muted, marginTop: 12, textAlign: "center" }}>
              Contact an admin to add or remove team members.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
