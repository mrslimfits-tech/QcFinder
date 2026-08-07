/**
 * services/agents/registry.js
 *
 * Single source of truth for which QC agent connectors exist, AND their
 * priority order (services/agents/*.js are queried in parallel, but this
 * array's order is what determines e.g. which agent's price/image wins
 * when more than one returns product info — see app/api/search/route.js).
 * Currently: Mulebuy, Hipobuy (CNFans and Fishgoo were both removed —
 * CNFans never had a confirmed endpoint; Fishgoo's endpoint was never
 * confirmed either and it was dropped per explicit request). Adding a
 * new agent later means: create services/agents/<name>.js following
 * base.js's contract, then add one line here in the position matching
 * its priority. Nothing else in the app needs to change.
 */

import mulebuy from "./mulebuy.js";
import hipobuy from "./hipobuy.js";

export const AGENTS = {
  [mulebuy.id]: mulebuy,
  [hipobuy.id]: hipobuy
};

export const AGENT_LIST = Object.values(AGENTS);

/** @param {string} id */
export function getAgent(id) {
  return AGENTS[id] ?? null;
}
