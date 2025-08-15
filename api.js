// api.js — client per la PWA del Torneig Continu 3B
// Usa les rutes tc3b/* i envia el token automàticament

// "import.meta.env" només existeix quan l'app s'empra amb un bundler com Vite.
// En executar el codi directament al navegador, "import.meta.env" és undefined
// i intentant accedir-hi provocava un error que aturava tota la inicialització
// de la PWA.  Fem servir valors buits per defecte quan les variables no hi són,
// de manera que la resta de funcionalitats (rànquing, agenda, etc.) continuïn
// funcionant encara que les crides a l'API del torneig no estiguin configurades.
const API_BASE = (import.meta.env && import.meta.env.VITE_APPS_SCRIPT_URL) || '';
const API_TOKEN = (import.meta.env && import.meta.env.VITE_API_TOKEN) || '';

async function apiRequest(path, method = 'GET', body = null) {
  const url = `${API_BASE}?path=${encodeURIComponent(path)}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    // sempre incloem el token a POST
    opts.body = JSON.stringify({ token: API_TOKEN, ...body });
  }
  return fetch(url, opts).then(async r => {
    const text = await r.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('API response parse error:', text);
      throw new Error(text);
    }
  });
}

// ----------- ENDPOINTS NOUS tc3b/* -----------

export function apiGetClassificacio() {
  return apiRequest('tc3b/classificacio', 'GET');
}

export function apiGetEspera() {
  return apiRequest('tc3b/espera', 'GET');
}

export function apiPostEsperaAlta(jugador_id) {
  return apiRequest('tc3b/espera', 'POST', { accio: 'alta', jugador_id });
}

export function apiPostEsperaBaixa(jugador_id) {
  return apiRequest('tc3b/espera', 'POST', { accio: 'baixa', jugador_id });
}

export function apiGetReptes() {
  return apiRequest('tc3b/reptes', 'GET');
}

export function apiCreateRepteNormal(reptador_id, reptat_id, dates_proposta = []) {
  return apiRequest('tc3b/reptes', 'POST', { tipus: 'normal', reptador_id, reptat_id, dates_proposta });
}

export function apiCreateRepteAcces(reptador_id, reptat_id) {
  return apiRequest('tc3b/reptes', 'POST', { tipus: 'acces', reptador_id, reptat_id });
}

export function apiAcceptRepte(id) {
  return apiRequest(`tc3b/reptes/${id}?action=acceptar`, 'POST', {});
}

export function apiResultatRepte(id, guanya_reptador, motiu = 'RESULTAT', partida = {}) {
  return apiRequest(`tc3b/reptes/${id}?action=resultat`, 'POST', { guanya_reptador, motiu, partida });
}

export function apiSenseAcordRepte(id) {
  return apiRequest(`tc3b/reptes/${id}?action=sense-acord`, 'POST', {});
}

export function apiIncompareixencaRepte(id) {
  return apiRequest(`tc3b/reptes/${id}?action=incompareixenca`, 'POST', {});
}

export function apiRevisioInactivitat() {
  return apiRequest('tc3b/cron/revisio-inactivitat', 'POST', {});
}
