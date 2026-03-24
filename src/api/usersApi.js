/**
 * usersApi.js — team management API calls.
 * All calls require admin role (enforced by the backend).
 */

import { apiFetch } from "./apiClient.js";

/** Returns { data: User[], count: number } */
export async function listUsers() {
  return apiFetch("/users");
}

/** Adds a new teammate. Returns the created User or throws on error. */
export async function addUser(email, role = "viewer") {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

/** Changes a user's role. Returns updated User. */
export async function updateUserRole(id, role) {
  return apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

/** Removes a teammate by id. Returns null on success (204). */
export async function removeUser(id) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}
