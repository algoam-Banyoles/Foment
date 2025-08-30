import { mostraRanquing } from './ranking.js';
import { mostraClassificacio } from './classificacio.js';
import { mostraAgenda } from './agenda.js';
import { mostraHorari } from './horari.js';
import { mostraEnllacos } from './enllacos.js';
import { mostraContinu3B } from './continu3b.js';
import { mostraTorneig } from './torneig.js';

  const uiSections = [
    'filters-row',
    'classificacio-filters',
    'torneig-buttons',
    'torneig-title',
    'torneig-category-buttons',
    'continu3b-buttons',
    'campionats-disclaimer',
    'content'
  ];

function hideAll() {
  uiSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function loadTorneig() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  fetch('data/modalitat.json')
    .then(r => r.json())
    .then(d => {
      const title = document.getElementById('torneig-title');
      const text = Array.isArray(d)
        ? d.map(m => m.Modalitat).join(', ')
        : (d.Modalitat || '');
      title.textContent = `Social Modalitat ${text}`;
      title.style.display = 'block';
    })
    .catch(() => {
      document.getElementById('torneig-title').style.display = 'none';
    });
}

const routes = {
  'btn-ranking': {
    show: [{ id: 'filters-row', display: 'flex' }],
    action: mostraRanquing
  },
  'btn-classificacio': {
    show: [{ id: 'classificacio-filters', display: 'flex' }],
    action: mostraClassificacio
  },
  'btn-agenda': { action: mostraAgenda },
  'btn-horari': { action: mostraHorari },
  'btn-enllacos': { action: mostraEnllacos },
  'btn-continu3b': {
    show: [
      { id: 'continu3b-buttons', display: 'flex' },
      { id: 'campionats-disclaimer', display: 'block' }
    ],
    action: mostraContinu3B
  },
  'btn-torneig': {
    show: [
      { id: 'torneig-buttons', display: 'flex' },
      { id: 'campionats-disclaimer', display: 'block' }
    ],
    action: loadTorneig
  }
};

function handleRoute(route) {
  hideAll();
  const content = document.getElementById('content');
  content.style.display = 'block';
  (route.show || []).forEach(({ id, display }) => {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
  });
  if (route.action) route.action();
}

export function setupRouter() {
  document.getElementById('menu').addEventListener('click', e => {
    if (e.target.classList.contains('menu-toggle')) {
      const target = document.getElementById(e.target.dataset.target);
      const isVisible = target.style.display === 'flex';
      document.querySelectorAll('.submenu').forEach(sm => (sm.style.display = 'none'));
      target.style.display = isVisible ? 'none' : 'flex';
      hideAll();
    }
  });

  document.getElementById('submenu-container').addEventListener('click', e => {
    const route = routes[e.target.id];
    if (route) {
      handleRoute(route);
    }
  });

  document.getElementById('torneig-buttons').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      const file = e.target.dataset.file;
      fetch(`data/${file}`)
        .then(r => r.json())
        .then(d => mostraTorneig(d, file))
        .catch(() => {
          document.getElementById('content').innerHTML = '<p>Error carregant dades.</p>';
        });
    }
  });
}

