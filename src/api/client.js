/**
 * API client for Asset QR PHP backend (api/index.php?action=...)
 * Uses session cookies + CSRF header. credentials: 'include' required.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api/index.php';

let csrfToken = '';

export function setCsrf(token) {
  csrfToken = token || '';
}

export function getCsrf() {
  return csrfToken;
}

export async function api(action, payload = {}, { method = 'POST' } = {}) {
  const url = `${API_BASE}?action=${encodeURIComponent(action)}`;
  const opts = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
  };
  if (method !== 'GET' && method !== 'HEAD') {
    opts.body = JSON.stringify(payload);
  }

  let res;
  let data = {};
  try {
    res = await fetch(url, opts);
    data = await res.json().catch(() => ({}));
  } catch {
    throw new Error('Unable to connect to the server.');
  }

  if (res.status === 401 && action !== 'login' && action !== 'session') {
    // Session expired — let AuthContext handle redirect
    const err = new Error(data.error || 'Session expired. Please login again.');
    err.status = 401;
    throw err;
  }
  if (!res.ok || data.success === false) {
    const err = new Error(data.error || 'Request failed.');
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Bootstrap session + CSRF (no prior token needed). */
export async function bootstrapSession() {
  const data = await api('session', {}, { method: 'POST' });
  if (data.csrf) setCsrf(data.csrf);
  return data;
}
