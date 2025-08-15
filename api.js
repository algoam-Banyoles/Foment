// api.js — client per la PWA del Torneig Continu 3B
// Usa les rutes tc3b/* i envia el token automàticament

const API_BASE = import.meta.env.VITE_APPS_SCRIPT_URL; // ex. "https://script.google.com/macros/s/XXXX/exec"
const API_TOKEN = import.meta.env.VITE_API_TOKEN;      // ex. "abcd1234"

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
  return fetch(url, opts).then(r => r.json());
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
