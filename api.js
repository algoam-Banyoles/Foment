/* ============================================================================
 * API client per al Campionat Continu 3B (PWA)
 * - Segur per CORS i token (compatible amb el router.gs que hem posat)
 * - Retrys exponencials i timeout configurable
 * - Mètodes d'alt nivell per als endpoints clau
 * ========================================================================== */

const CONFIG = {
  // 1) SUBSTITUEIX pel teu URL de desplegament d’Apps Script (exec)
  //    Ex: "https://script.google.com/macros/s/AKfycbx.../exec"
  DEPLOY_URL: import.meta?.env?.VITE_APPS_SCRIPT_URL || "<POSA_AQUI_EXEC_URL>",

  // 2) SUBSTITUEIX pel teu token (o posa’l a .env → VITE_API_TOKEN)
  API_TOKEN: import.meta?.env?.VITE_API_TOKEN || "<POSA_AQUI_TOKEN>",

  // Timeout per cada intent (ms)
  TIMEOUT_MS: 15000,

  // Nombre màxim d’intents (1 = sense retries)
  MAX_RETRIES: 3,
};

// ---------- Utils ----------
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = CONFIG.TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(resource, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

function buildUrl(path, query = {}) {
  const u = new URL(CONFIG.DEPLOY_URL);
  const qp = new URLSearchParams({
    path, // el router.gs llegeix ?path=...
    ...query,
  });
  u.search = qp.toString();
  return u.toString();
}

async function fetchJSON(method, path, { query = {}, body = null, requireToken = false } = {}) {
  const needToken = requireToken || method === "POST";
  const headers = {
    "Content-Type": "application/json",
  };

  // Enviem el token principalment al body (POST). Per GET només si cal.
  const bodyPayload = body && needToken
    ? { ...body, token: CONFIG.API_TOKEN }
    : body;

  // Si cal token però fem GET, afegim-lo a query per simplicitat
  const queryWithToken = needToken && method === "GET"
    ? { ...query, token: CONFIG.API_TOKEN }
    : query;

  let attempt = 0;
  let lastErr = null;

  while (attempt < CONFIG.MAX_RETRIES) {
    try {
      const resp = await fetchWithTimeout(
        buildUrl(path, queryWithToken),
        {
          method,
          headers,
          body: method === "POST" ? JSON.stringify(bodyPayload || {}) : null,
          credentials: "omit", // CORS simple; el servidor ja valida token
          mode: "cors",
        },
        CONFIG.TIMEOUT_MS
      );

      // Apps Script amb ContentService no canvia codi HTTP,
      // però si algun proxy ho fa, gestionem-ho igualment.
      const text = await resp.text();
      let json;
      try { json = text ? JSON.parse(text) : {}; } catch {
        throw new Error(`INVALID_JSON_RESPONSE: ${text?.slice(0, 200) || "<empty>"}`);
      }

      // El nostre router torna {error:...} en cas d’error aplicatiu
      if (json && json.error) {
        // Casos especials
        if (String(json.error).includes("UNAUTHORIZED")) {
          throw new Error("UNAUTHORIZED: token invàlid o absent");
        }
        throw new Error(String(json.error));
      }

      return json;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      if (attempt >= CONFIG.MAX_RETRIES) break;
      // Backoff exponencial suau
      await delay(150 * attempt);
    }
  }

  // Si arribem aquí, no ha anat bé
  throw lastErr || new Error("NETWORK_ERROR");
}

// ---------- Mètodes d’alt nivell ----------

// GET públics (o amb token si ho configures així al backend)
export async function apiGetRanking() {
  return fetchJSON("GET", "ranking");
}
export async function apiGetWaitlist() {
  return fetchJSON("GET", "llista-espera");
}
export async function apiListChallenges() {
  return fetchJSON("GET", "reptes");
}

// Mutacions (POST) — sempre amb token
export async function apiWaitlistAdd(jugador_id) {
  return fetchJSON("POST", "llista-espera", {
    requireToken: true,
    body: { accio: "alta", jugador_id },
  });
}
export async function apiWaitlistRemove(jugador_id) {
  return fetchJSON("POST", "llista-espera", {
    requireToken: true,
    body: { accio: "baixa", jugador_id },
  });
}

// Crear reptes
export async function apiCreateNormal({ reptador_id, reptat_id, dates_proposta = [] }) {
  return fetchJSON("POST", "reptes", {
    requireToken: true,
    body: { tipus: "normal", reptador_id, reptat_id, dates_proposta },
  });
}
export async function apiCreateAccess({ reptador_id, reptat_id }) {
  return fetchJSON("POST", "reptes", {
    requireToken: true,
    body: { tipus: "acces", reptador_id, reptat_id },
  });
}

// Accions sobre un repte
export async function apiAcceptChallenge(id) {
  return fetchJSON("POST", `reptes/${encodeURIComponent(id)}`, {
    requireToken: true,
    query: { action: "acceptar" },
    body: {}, // token al body
  });
}
export async function apiResultChallenge(id, { guanya_reptador, motiu = "RESULTAT", partida = {} }) {
  return fetchJSON("POST", `reptes/${encodeURIComponent(id)}`, {
    requireToken: true,
    query: { action: "resultat" },
    body: { guanya_reptador, motiu, partida },
  });
}
export async function apiNoAgreement(id) {
  return fetchJSON("POST", `reptes/${encodeURIComponent(id)}`, {
    requireToken: true,
    query: { action: "sense-acord" },
    body: {},
  });
}
export async function apiWalkover(id) {
  return fetchJSON("POST", `reptes/${encodeURIComponent(id)}`, {
    requireToken: true,
    query: { action: "incompareixenca" },
    body: {},
  });
}

// Cron
export async function apiCronReviewInactivity() {
  return fetchJSON("POST", "cron/revisio-inactivitat", {
    requireToken: true,
    body: {},
  });
}

export default {
  apiGetRanking,
  apiGetWaitlist,
  apiListChallenges,
  apiWaitlistAdd,
  apiWaitlistRemove,
  apiCreateNormal,
  apiCreateAccess,
  apiAcceptChallenge,
  apiResultChallenge,
  apiNoAgreement,
  apiWalkover,
  apiCronReviewInactivity,
};

