/**
 * api.js — Centralized API utility for CebuCarTour.
 *
 * All requests attach the JWT from localStorage automatically.
 * Throws an Error (with the server's error message) on non-2xx responses.
 */

const BASE = import.meta.env.VITE_API_URL + '/api';

const TOKEN_KEY = 'cebuCartour_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);

// ─── core fetch wrapper ───────────────────────────────────────────────────────

const apiFetch = async (path, options = {}) => {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (res.status === 401 && getToken()) {
    // Token present but server rejected it — session expired or invalidated.
    // Clear credentials and notify the app to redirect to login.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('cebuCartour_user');
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
};

// ─── public API object ────────────────────────────────────────────────────────

// Compress image client-side before upload (max 1600px, 82% JPEG quality)
const compressImage = (file, maxPx = 1600, quality = 0.82) =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else                 { width  = Math.round(width  * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
        'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

export const api = {
  // ── Upload ────────────────────────────────────────────────────────────────
  upload: async (file) => {
    const token      = getToken();
    const compressed = await compressImage(file);
    const form       = new FormData();
    form.append('file', compressed);
    const res = await fetch(`${BASE}/upload`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    form,
    });
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
    return data; // { url, filename }
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    login: (email, password) =>
      apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (userData) =>
      apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    me: () => apiFetch('/auth/me'),

    forgotPassword: (email) =>
      apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token, password) =>
      apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  users: {
    getAll:   ()        => apiFetch('/users?limit=200').then(r => r.data ?? []),
    list: (params = {}) => apiFetch('/users?' + new URLSearchParams(params)),

    getById: (id) => apiFetch(`/users/${id}`),

    update: (id, data) =>
      apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    changePassword: (id, current, newPw) =>
      apiFetch(`/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ current, newPw }),
      }),

    setPassword: (id, newPw) =>
      apiFetch(`/users/${id}/set-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPw }),
      }),

    delete: (id) => apiFetch(`/users/${id}`, { method: 'DELETE' }),

    approve: (id) => apiFetch(`/users/${id}/approve`, { method: 'PUT' }),

    reject: (id, reason) =>
      apiFetch(`/users/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),

    suspend: (id) => apiFetch(`/users/${id}/suspend`, { method: 'PUT' }),

    resendInvite: (id) => apiFetch(`/users/${id}/resend-invite`, { method: 'POST' }),

    requestDeletion: (id, reason) =>
      apiFetch(`/users/${id}/deletion-request`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),

    cancelDeletion: (id) =>
      apiFetch(`/users/${id}/cancel-deletion`, { method: 'PUT' }),
  },

  // ── Cars ──────────────────────────────────────────────────────────────────
  cars: {
    getAll:   ()        => apiFetch('/cars').then(r => r.data),
    list: (params = {}) => apiFetch('/cars?' + new URLSearchParams(params)),

    getById: (id) => apiFetch(`/cars/${id}`),

    create: (data) =>
      apiFetch('/cars', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id, data) =>
      apiFetch(`/cars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id) => apiFetch(`/cars/${id}`, { method: 'DELETE' }),
  },

  // ── Tours ─────────────────────────────────────────────────────────────────
  tours: {
    getAll:   ()        => apiFetch('/tours').then(r => r.data),
    list: (params = {}) => apiFetch('/tours?' + new URLSearchParams(params)),

    getById: (id) => apiFetch(`/tours/${id}`),

    create: (data) =>
      apiFetch('/tours', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id, data) =>
      apiFetch(`/tours/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id) => apiFetch(`/tours/${id}`, { method: 'DELETE' }),
  },

  // ── Bookings ──────────────────────────────────────────────────────────────
  bookings: {
    getAll:   ()        => apiFetch('/bookings').then(r => r.data),
    list: (params = {}) => apiFetch('/bookings?' + new URLSearchParams(params)),

    getById: (id) => apiFetch(`/bookings/${id}`),

    create: (data) =>
      apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id, data) =>
      apiFetch(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id) => apiFetch(`/bookings/${id}`, { method: 'DELETE' }),
  },

  // ── Destinations ──────────────────────────────────────────────────────────
  destinations: {
    getAll:   ()        => apiFetch('/destinations').then(r => r.data),
    list: (params = {}) => apiFetch('/destinations?' + new URLSearchParams(params)),

    getById: (id) => apiFetch(`/destinations/${id}`),

    create: (data) =>
      apiFetch('/destinations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id, data) =>
      apiFetch(`/destinations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id) => apiFetch(`/destinations/${id}`, { method: 'DELETE' }),
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    getServiceFee: () => apiFetch('/settings/service-fee'),

    updateServiceFee: (fee) =>
      apiFetch('/settings/service-fee', {
        method: 'PUT',
        body: JSON.stringify({ fee }),
      }),

    getHeroSlides: () => apiFetch('/settings/hero-slides'),

    updateHeroSlides: (slides) =>
      apiFetch('/settings/hero-slides', {
        method: 'PUT',
        body: JSON.stringify({ slides }),
      }),

    getTeamMembers: () => apiFetch('/settings/team-members'),

    updateTeamMembers: (members) =>
      apiFetch('/settings/team-members', {
        method: 'PUT',
        body: JSON.stringify({ members }),
      }),
  },
};
