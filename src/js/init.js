import { mostraRanquing } from './ranking.js';
import { mostraClassificacio } from './classificacio.js';
import { state } from './state.js';

function setupTheme() {
  const body = document.body;
  const btn = document.getElementById('btn-dark-mode');
  if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
  }
  btn.addEventListener('click', () => {
    body.classList.toggle('dark');
    localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
  });
}

export function inicialitza() {
  setupTheme();
  Promise.all([
    fetch('data/ranquing.json').then(r => r.json()),
    fetch('data/classificacions.json').then(r => r.json()).catch(() => []),
    fetch('data/events.json').then(r => r.json()).catch(() => []),
    fetch('data/calendari.json').then(r => r.json()).catch(() => []),
    fetch('data/festius.json').then(r => r.json()).catch(() => [])
  ])
    .then(([dadesRanking, dadesClass, dadesEvents, dadesCalendari, dadesFestius]) => {
      state.ranquing = dadesRanking;
      state.anys = [...new Set(dadesRanking.map(d => parseInt(d.Any, 10)))]
        .sort((a, b) => a - b);
      state.anySeleccionat = state.anys[state.anys.length - 1];

      state.classificacions = dadesClass;
      state.classYears = [...new Set(dadesClass.map(d => parseInt(d.Any, 10)))]
        .sort((a, b) => a - b);
      state.classAnySeleccionat = state.classYears[state.classYears.length - 1] || null;
      const categories = new Set(dadesClass.map(d => d.Categoria));
      state.classCategoriaSeleccionada = categories.values().next().value || null;

      state.events = dadesEvents
        .map(ev => {
          const titol = ev['Títol'] || ev['Titol'] || '';
          return {
            ...ev,
            'Títol': titol,
            Tipus: titol.toLowerCase().includes('assemblea') ? 'assemblea' : 'altre'
          };
        })
        .concat(
          dadesCalendari.map(p => ({
            Data: p.Data,
            Hora: '',
            Títol: `${p['Jugador A'].trim()} vs ${p['Jugador B'].trim()} (${p.Hora})`,
            Tipus: 'partida'
          }))
        )
        .concat(
          dadesFestius.map(f => ({
            Data: f.Data,
            Hora: '',
            Títol: `Foment tancat (${f.Títol || ''})`,
            Tipus: 'festiu'
          }))
        );

      preparaSelectors();
      preparaSelectorsClassificacio();
      document.getElementById('btn-agenda').click();
    })
    .catch(err => {
      console.error('Error carregant dades', err);
    });
}

export function preparaSelectors() {
  const select = document.getElementById('year-select');
  select.innerHTML = '';
  state.anys.slice().sort((a, b) => b - a).forEach(any => {
    const opt = document.createElement('option');
    opt.value = any;
    opt.textContent = any;
    if (any === state.anySeleccionat) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    state.anySeleccionat = parseInt(select.value, 10);
    mostraRanquing();
  });

  const cont = document.getElementById('modalitat-buttons');
  cont.querySelectorAll('button').forEach(btn => {
    if (btn.dataset.mod === state.modalitatSeleccionada) {
      btn.classList.add('selected');
    }
    btn.addEventListener('click', () => {
      state.modalitatSeleccionada = btn.dataset.mod;
      cont.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      mostraRanquing();
    });
  });
}

export function preparaSelectorsClassificacio() {
  const yearSel = document.getElementById('classificacio-year-select');
  yearSel.innerHTML = '';
  state.classYears.slice().sort((a, b) => b - a).forEach(any => {
    const opt = document.createElement('option');
    opt.value = any;
    opt.textContent = any;
    if (any === state.classAnySeleccionat) opt.selected = true;
    yearSel.appendChild(opt);
  });
  yearSel.addEventListener('change', () => {
    state.classAnySeleccionat = parseInt(yearSel.value, 10);
    mostraClassificacio();
  });

  const modalBtns = document.getElementById('classificacio-modalitat-buttons');
  modalBtns.querySelectorAll('button').forEach(btn => {
    if (btn.dataset.mod === state.classModalitatSeleccionada) {
      btn.classList.add('selected');
    }
    btn.addEventListener('click', () => {
      state.classModalitatSeleccionada = btn.dataset.mod;
      modalBtns.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      mostraClassificacio();
    });
  });

  const catBtns = document.getElementById('categoria-buttons');
  catBtns.innerHTML = '';
  const cats = [...new Set(state.classificacions.map(c => c.Categoria))].sort();
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    if (cat === state.classCategoriaSeleccionada) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      state.classCategoriaSeleccionada = cat;
      catBtns.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      mostraClassificacio();
    });
    catBtns.appendChild(btn);
  });
}

export function preparaTorneigCategories(categories, render) {
  const cont = document.getElementById('torneig-category-buttons');
  cont.innerHTML = '';
  if (!categories || categories.length === 0) {
    cont.style.display = 'none';
    state.torneigCategoriaSeleccionada = null;
    render();
    return;
  }
  categories.sort();
  if (!state.torneigCategoriaSeleccionada || !categories.includes(state.torneigCategoriaSeleccionada)) {
    state.torneigCategoriaSeleccionada = categories[0];
  }
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = `${cat}a`;
    if (cat === state.torneigCategoriaSeleccionada) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      state.torneigCategoriaSeleccionada = cat;
      cont.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      render();
    });
    cont.appendChild(btn);
  });
  cont.style.display = 'flex';
  render();
}
