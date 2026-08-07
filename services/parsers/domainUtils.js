/**
 * services/parsers/domainUtils.js
 */

/**
 * @param {string} hostname
 * @param {string} domain
 */
export function endsWithDomain(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}
