"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

/**
 * Get auth headers with Bearer token
 */
const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": true,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Fetch all emergency encounters
 */
export const getEmergencyEncounters = async () => {
  const response = await fetch(`${API_BASE_URL}/emergency-encounters`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch emergency encounters");
  }

  return response.json();
};

/**
 * Get a single emergency encounter by ID
 */
export const getEmergencyEncounterById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/emergency-encounters/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch emergency encounter");
  }

  return response.json();
};

/**
 * Create a new emergency encounter
 */
export const createEmergencyEncounter = async (data) => {
  const response = await fetch(`${API_BASE_URL}/emergency-encounters`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Failed to create emergency encounter");
  }

  return result;
};

/**
 * Update an existing emergency encounter
 */
export const updateEmergencyEncounter = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/emergency-encounters/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Failed to update emergency encounter");
  }

  return result;
};

/**
 * Delete an emergency encounter
 */
export const deleteEmergencyEncounter = async (id) => {
  const response = await fetch(`${API_BASE_URL}/emergency-encounters/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete emergency encounter");
  }

  return response.json().catch(() => ({ success: true }));
};
