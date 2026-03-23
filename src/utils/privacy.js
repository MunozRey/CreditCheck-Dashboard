/**
 * Privacy masking utilities — presentation layer only.
 * Raw data is never mutated; masking applies at render time.
 *
 * Rules:
 *   maskName("Marc Borras Egido") → "Ma*** Bo*** Eg***"
 *     Each word: first 2 chars + "***"
 *   maskEmail("marc@gmail.com") → "ma***@gmail.com"
 *     Username: first 2 chars + "***" | domain unchanged
 */

export function maskName(name) {
  if (!name || typeof name !== "string") return name || "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.slice(0, 2) + "***")
    .join(" ");
}

export function maskEmail(email) {
  if (!email || typeof email !== "string") return email || "";
  const atIdx = email.indexOf("@");
  if (atIdx < 0) return email.slice(0, 2) + "***";
  const user   = email.slice(0, atIdx);
  const domain = email.slice(atIdx); // includes the "@"
  return user.slice(0, 2) + "***" + domain;
}
