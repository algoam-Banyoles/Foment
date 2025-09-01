import { state } from './state.js';

// Inicialitza recursos necessaris per a la gestió de reptes
export async function initGestioReptesAdmin() {
  console.log('Mòdul de gestió de reptes carregat');
}

// Mostra el panell de gestió de reptes dins del contenidor rebut
export async function mostraGestioReptes(container) {
  container.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = 'Gestió de reptes';
  container.appendChild(title);

  try {
    const res = await fetch('/api/challenges');
    const data = await res.json();
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2);
    container.appendChild(pre);
  } catch (err) {
    const p = document.createElement('p');
    p.textContent = 'Error carregant reptes';
    container.appendChild(p);
  }
}
