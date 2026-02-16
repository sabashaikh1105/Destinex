const API_BASE = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
export const AUTH_TOKEN_KEY = "destinex.authToken";

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

const request = async (path, options = {}) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

export const setAuthToken = (token) => {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const loginUser = async ({ email, password }) =>
  request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const registerUser = async (payload) =>
  request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });

export const getCurrentUser = async () => request("/api/auth/me");

export const updateMyProfile = async (payload) =>
  request("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });

export const requestPasswordReset = async ({ email }) =>
  request("/api/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = async ({ email, code, newPassword }) =>
  request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });

export const createOrUpdateTrip = async (tripPayload) =>
  request("/api/trips", {
    method: "POST",
    body: JSON.stringify(tripPayload || {}),
  });

export const getTripById = async (tripId) =>
  request(`/api/trips/${encodeURIComponent(tripId)}`);

export const getTrips = async ({ userId, userEmail } = {}) => {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (userEmail) params.set("userEmail", userEmail);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/api/trips${query}`);
};

export const updateTrip = async (tripId, updates) =>
  request(`/api/trips/${encodeURIComponent(tripId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates || {}),
  });

export const submitContactMessage = async (payload) =>
  request("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
