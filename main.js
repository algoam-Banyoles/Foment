import { setupServiceWorker } from './js/sw-register.js';
import { inicialitza } from './js/init.js';
import { setupRouter } from './js/router.js';
import { closeChart, handleResize } from './js/graficos.js';

setupServiceWorker();


document.querySelectorAll('.menu-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const isVisible = target.style.display === 'flex';
    document.querySelectorAll('.submenu').forEach(sm => {
      sm.style.display = 'none';
      sm.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.menu-toggle').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (!isVisible) {
      target.style.display = 'flex';
      target.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      const firstButton = target.querySelector('button');
      if (firstButton) firstButton.focus();
    } else {
      target.style.display = 'none';
      target.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
    }
    document.getElementById('filters-row').style.display = 'none';
    document.getElementById('classificacio-filters').style.display = 'none';
    document.getElementById('torneig-buttons').style.display = 'none';
    document.getElementById('torneig-title').style.display = 'none';
    document.getElementById('torneig-category-buttons').style.display = 'none';
    document.getElementById('continu3b-buttons').style.display = 'none';
    document.getElementById('content').style.display = 'none';
  });
});

document.getElementById('btn-ranking').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'flex';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('continu3b-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraRanquing();
});

document.getElementById('btn-classificacio').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'flex';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('continu3b-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraClassificacio();
});

document.getElementById('btn-agenda').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('continu3b-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraAgenda();
});

document.getElementById('btn-horari').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('continu3b-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraHorari();
});

document.getElementById('btn-enllacos').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('continu3b-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraEnllacos();
});

document.getElementById('btn-continu3b').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  const cont = document.getElementById('content');
  cont.style.display = 'block';
  const btns = document.getElementById('continu3b-buttons');
  btns.style.display = 'flex';
  mostraContinu3B();
});

document.getElementById('btn-torneig').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'flex';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('continu3b-buttons').style.display = 'none';
  const cont = document.getElementById('content');
  cont.style.display = 'block';
  cont.innerHTML = '';
  fetch('data/modalitat.json')
    .then(r => r.json())
    .then(d => {
      const modalObj = Array.isArray(d) ? (d[0] || {}) : (d || {});
      const title = document.getElementById('torneig-title');
      title.textContent = `Social Modalitat ${Array.isArray(d) ? d.map(m => m.Modalitat).join(', ') : (d.Modalitat || '')}`;
      title.style.display = 'block';
    })
    .catch(() => {
      const title = document.getElementById('torneig-title');
      title.style.display = 'none';
    });
});

document.querySelectorAll('#torneig-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const file = btn.dataset.file;
    fetch(`data/${file}`)
      .then(r => r.json())
      .then(d => mostraTorneig(d, file))
      .catch(() => {
        document.getElementById('content').innerHTML = '<p>Error carregant dades.</p>';
      });
  });
});


document.getElementById('close-chart').addEventListener('click', closeChart);
window.addEventListener('resize', handleResize);

inicialitza();
