/**
 * API helper: fetch with JWT Authorization header attached.
 * Use for all authenticated requests to the backend.
 */
import { getStoredToken } from './auth';

/**
 * Same as fetch(), but adds Authorization: Bearer <token> when a token is stored.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
export function fetchWithAuth(url, options = {}) {
  const token = getStoredToken();
  const init = { ...options };
  init.headers = new Headers(init.headers || {});
  if (token) {
    init.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, init);
}
