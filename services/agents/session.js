/**
 * services/agents/session.js
 *
 * Some agent endpoints reject requests without a valid session
 * cookie/token (anti-scraping / logged-in-only data). This app has no
 * way to generate those on its own — they come from a real logged-in
 * session on the agent's site. What this module DOES do is give every
 * connector a single, consistent, server-only place to read them from,
 * so credentials never touch the client bundle.
 *
 * Configure via environment variables (see .env.example):
 *   MULEBUY_COOKIE, MULEBUY_TOKEN
 *   HIPOBUY_COOKIE, HIPOBUY_TOKEN
 *
 * How to obtain a real value: log into the agent's site in a browser,
 * open DevTools → Network, find an authenticated request, and copy the
 * `Cookie` header (or the bearer token if the site uses one instead).
 * These typically expire — treat them as something you rotate manually
 * for this MVP, not a permanent credential.
 *
 * If nothing is configured, connectors simply omit the header and try
 * unauthenticated — some endpoints work fine without one.
 */

/**
 * @param {string} agentId - e.g. "mulebuy"
 * @returns {{ cookie?: string, token?: string }}
 */
export function getAgentSession(agentId) {
  const prefix = agentId.toUpperCase();
  return {
    cookie: process.env[`${prefix}_COOKIE`] || undefined,
    token: process.env[`${prefix}_TOKEN`] || undefined
  };
}

/**
 * Builds the extra headers a request should carry, given whatever
 * session info is configured for that agent. Never throws, never
 * fabricates a value.
 * @param {string} agentId
 */
export function buildAuthHeaders(agentId) {
  const { cookie, token } = getAgentSession(agentId);
  /** @type {Record<string,string>} */
  const headers = {};
  if (cookie) headers["Cookie"] = cookie;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
