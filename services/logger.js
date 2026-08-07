/**
 * services/logger.js
 *
 * Minimal structured logging so agent requests are traceable in server
 * logs across multiple, distinct searches. Every log line carries a
 * requestId so you can grep one search's full trail (parse -> cache
 * check -> every agent attempt -> save) even when requests overlap.
 */

export function logStep(requestId, scope, message, details = {}) {
  const line = {
    requestId,
    scope,
    message,
    ...details,
    t: new Date().toISOString()
  };
  console.log(`[qc-finder] ${JSON.stringify(line)}`);
}

/** Short, human-scannable id to correlate one search's log lines. */
export function newRequestId() {
  return Math.random().toString(36).slice(2, 8);
}
