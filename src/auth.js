/**
 * Auth helpers: token storage and JWT expiration check.
 */

export const AUTH_KEY = 'pdam_auth';
export const TOKEN_KEY = 'pdam_token';
export const USER_KEY = 'pdam_user';

/** Get stored token from localStorage or sessionStorage (same order as login). */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

/**
 * Decode JWT payload (no signature verification; used only for exp check).
 * Returns null if invalid or not a JWT.
 */
function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Check if JWT is expired. Uses exp claim (seconds since epoch).
 * @param {string} token - JWT string
 * @param {number} bufferSeconds - Consider expired this many seconds before exp (default 60)
 * @returns {boolean} true if token is missing, invalid, or expired
 */
export function isJwtExpired(token, bufferSeconds = 60) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - bufferSeconds <= now;
}

/**
 * Returns true if user is considered authenticated: has a token and it is not expired.
 */
export function isAuthenticated() {
  const token = getStoredToken();
  if (!token) return false;
  if (isJwtExpired(token)) return false;
  return true;
}

/** Remove auth data from both storages (e.g. when token is expired). */
export function clearAuthStorage() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/** Clear auth storage if the stored token is expired. Call on app load to avoid keeping stale tokens. */
export function clearExpiredAuth() {
  const token = getStoredToken();
  if (token && isJwtExpired(token)) clearAuthStorage();
}
