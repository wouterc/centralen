// --- Fil: src/config.ts ---
/**
 * API_BASE_URL styres via import.meta.env (Vite)
 * Lokalt: 'http://localhost:8030/api'
 * Produktion: '/api'
 */

// @ts-ignore
const envUrl = import.meta.env.VITE_API_BASE_URL;
let baseUrl = envUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:8030/api');

// Normalize: ensure it doesn't end with a slash
if (baseUrl.endsWith('/') && baseUrl.length > 1) {
    baseUrl = baseUrl.slice(0, -1);
}

export const API_BASE_URL: string = baseUrl;
