/**
 * App config from environment.
 * Set VITE_BASE_URL in .env (e.g. http://localhost or http://localhost/PDAM_app or http://localhost:3000 for auth API).
 */
export const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost').replace(/\/$/, '');

/** Base URL for API (login, etc.). Same as BASE_URL so /user/login is {VITE_BASE_URL}/user/login */
export const API_BASE_URL = BASE_URL;

/** Pagination defaults for branch (and other) list views */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
