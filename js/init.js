import { mostraRanquing } from './ranking.js';
import { mostraClassificacio } from './classificacio.js';

export let ranquing = [];
export let anys = [];
export let anySeleccionat = null;
export let modalitatSeleccionada = '3 BANDES';
export let lineChart = null;

export let classificacions = [];
export let classYears = [];
export let classAnySeleccionat = null;
export let classModalitatSeleccionada = '3 BANDES';
export let classCategoriaSeleccionada = null;

export let events = [];
export let agendaSetmanaInici = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
})();
export let torneigModalitat = '';
export let torneigCaramboles = {};
export let torneigCategoriaSeleccionada = null;

export function setLineChart(chart) {
  lineChart = chart;
}

export function appendResponsiveTable(container, table) {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-responsive';
  wrapper.appendChild(table);
  container.appendChild(wrapper);
}

export function adjustChartSize() {
  const chartContainer = document.getElementById('player-chart');
  if (chartContainer) {
    chartContainer.style.width = '90vw';
    chartContainer.style.height = '96vh';
  }
  const canvas = document.getElementById('chart-canvas');
  if (canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }
  if (lineChart) {
    lineChart.resize();
  }
}

export function inicialitza() {
  Promise.all([
    fetch('data/ranquing.json').then(r => r.json()),
    fetch('data/classificacions.json').then(r => r.json()).catch(() => []),
    fetch('data/events.json').then(r => r.json()).catch(() => []),
    fetch('data/calendari.json').then(r => r.json()).catch(() => []),
    fetch('data/festius.json').then(r => r.json()).catch(() => [])
  ])
    .then(([dadesRanking, dadesClass, dadesEvents, dadesCalendari, dadesFestius]) => {
      ranquing = dadesRanking;
      anys = [...new Set(dadesRanking.map(d => parseInt(d.Any, 10)))]
        .sort((a, b) => a - b);
      anySeleccionat = anys[anys.length - 1];

      classificacions = dadesClass;
      classYears = [...new Set(dadesClass.map(d => parseInt(d.Any, 10)))]
        .sort((a, b) => a - b);
      classAnySeleccionat = classYears[classYears.length - 1] || null;
      const categories = new Set(dadesClass.map(d => d.Categoria));
      classCategoriaSeleccionada = categories.values().next().value || null;

      events = dadesEvents
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
  anys.slice().sort((a, b) => b - a).forEach(any => {
    const opt = document.createElement('option');
    opt.value = any;
    opt.textContent = any;
    if (any === anySeleccionat) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    anySeleccionat = parseInt(select.value, 10);
    mostraRanquing();
  });

  const cont = document.getElementById('modalitat-buttons');
  cont.querySelectorAll('button').forEach(btn => {
    if (btn.dataset.mod === modalitatSeleccionada) {
      btn.classList.add('selected');
    }
    btn.addEventListener('click', () => {
      modalitatSeleccionada = btn.dataset.mod;
      cont.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      mostraRanquing();
    });
  });
}

export function preparaSelectorsClassificacio() {
  const yearSel = document.getElementById('classificacio-year-select');
  yearSel.innerHTML = '';
  classYears.slice().sort((a, b) => b - a).forEach(any => {
    const opt = document.createElement('option');
    opt.value = any;
    opt.textContent = any;
    if (any === classAnySeleccionat) opt.selected = true;
    yearSel.appendChild(opt);
  });
  yearSel.addEventListener('change', () => {
    classAnySeleccionat = parseInt(yearSel.value, 10);
    mostraClassificacio();
  });

  const modalBtns = document.getElementById('classificacio-modalitat-buttons');
  modalBtns.querySelectorAll('button').forEach(btn => {
    if (btn.dataset.mod === classModalitatSeleccionada) {
      btn.classList.add('selected');
    }
    btn.addEventListener('click', () => {
      classModalitatSeleccionada = btn.dataset.mod;
      modalBtns.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      mostraClassificacio();
    });
  });

  const catBtns = document.getElementById('categoria-buttons');
  catBtns.innerHTML = '';
  const cats = [...new Set(classificacions.map(c => c.Categoria))].sort();
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    if (cat === classCategoriaSeleccionada) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      classCategoriaSeleccionada = cat;
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
    torneigCategoriaSeleccionada = null;
    render();
    return;
  }
  categories.sort();
  if (!torneigCategoriaSeleccionada || !categories.includes(torneigCategoriaSeleccionada)) {
    torneigCategoriaSeleccionada = categories[0];
  }
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = `${cat}a`;
    if (cat === torneigCategoriaSeleccionada) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      torneigCategoriaSeleccionada = cat;
      cont.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      render();
    });
    cont.appendChild(btn);
  });
  cont.style.display = 'flex';
  render();
}
