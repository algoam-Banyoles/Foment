if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        console.log('SW registrat!', reg);
      })
      .catch(err => console.error('Error al registrar el SW:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  });
}

let ranquing = [];
let anys = [];
let anySeleccionat = null;
let modalitatSeleccionada = '3 BANDES';
let lineChart = null;

let classificacions = [];
let classYears = [];
let classAnySeleccionat = null;
let classModalitatSeleccionada = '3 BANDES';
let classCategoriaSeleccionada = null;

let events = [];

function adjustChartSize() {
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

function inicialitza() {
  Promise.all([
    fetch('ranquing.json').then(r => r.json()),
    fetch('classificacions.json').then(r => r.json()).catch(() => []),
    fetch('events.json').then(r => r.json()).catch(() => [])
  ])
    .then(([dadesRanking, dadesClass, dadesEvents]) => {
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

      events = dadesEvents;

      preparaSelectors();
      preparaSelectorsClassificacio();
    })
    .catch(err => {
      console.error('Error carregant dades', err);
    });
}

function preparaSelectors() {
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

function preparaSelectorsClassificacio() {
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

  const catSel = document.getElementById('categoria-select');
  catSel.innerHTML = '';
  const cats = [...new Set(classificacions.map(c => c.Categoria))].sort();
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === classCategoriaSeleccionada) opt.selected = true;
    catSel.appendChild(opt);
  });
  catSel.addEventListener('change', () => {
    classCategoriaSeleccionada = catSel.value;
    mostraClassificacio();
  });
}

function mostraRanquing() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  const taula = document.createElement('table');
  const cap = document.createElement('tr');
  ['Posició', 'Jugador', 'Mitjana'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    cap.appendChild(th);
  });
  taula.appendChild(cap);

  const dadesOrdenades = ranquing
    .filter(
      reg =>
        parseInt(reg.Any, 10) === anySeleccionat &&
        reg.Modalitat === modalitatSeleccionada
    )
    .sort((a, b) => parseFloat(b.Mitjana) - parseFloat(a.Mitjana));

  dadesOrdenades.forEach((reg, idx) => {
    const tr = document.createElement('tr');
    // Posicio es calcula per si l'array no esta préviament ordenat
    ['Posició', 'Jugador', 'Mitjana'].forEach(clau => {
      const td = document.createElement('td');
      let valor;
      if (clau === 'Posició') {
        valor = idx + 1;
      } else if (clau === 'Mitjana') {
        valor = Number.parseFloat(reg[clau]).toFixed(3);
      } else {
        valor = clau === 'Jugador' ? reg.NomComplet : reg[clau];
      }
      td.textContent = valor;
      if (clau === 'Jugador') {
        td.classList.add('player-cell');
        td.addEventListener('click', e => {
          e.stopPropagation();
          mostraEvolucioJugador(reg.Jugador, reg.NomComplet);
        });
      }
      tr.appendChild(td);

    });
    tr.addEventListener('click', () => {
      mostraEvolucioJugador(reg.Jugador, reg.NomComplet);
    });
    taula.appendChild(tr);
  });
  cont.appendChild(taula);
}

function mostraClassificacio() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  const taula = document.createElement('table');
  const cap = document.createElement('tr');
  ['Posició', 'Jugador', 'Punts', 'Caramboles', 'Entrades', 'Mitjana General', 'Mitjana Particular'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    cap.appendChild(th);
  });
  taula.appendChild(cap);

  const dades = classificacions
    .filter(r =>
      parseInt(r.Any, 10) === classAnySeleccionat &&
      r.Modalitat === classModalitatSeleccionada &&
      r.Categoria === classCategoriaSeleccionada
    )
    .sort((a, b) => parseInt(a.Posició, 10) - parseInt(b.Posició, 10));

  dades.forEach(reg => {
    const tr = document.createElement('tr');
    ['Posició', 'Jugador', 'Punts', 'Caramboles', 'Entrades', 'MitjanaGeneral', 'MitjanaParticular'].forEach(clau => {
      const td = document.createElement('td');
      let valor = reg[clau];
      if (clau === 'MitjanaGeneral' || clau === 'MitjanaParticular') {
        valor = Number.parseFloat(valor).toFixed(3);
      }
      td.textContent = valor;
      tr.appendChild(td);
    });
    taula.appendChild(tr);
  });
  cont.appendChild(taula);
}

function mostraAgenda() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.textContent = 'Propers esdeveniments';
  cont.appendChild(h2);

  const taula = document.createElement('table');

  const avui = new Date();
  const limit = new Date();
  limit.setMonth(limit.getMonth() + 2);

  const futurs = events
    .map(ev => ({ ...ev, _d: new Date(ev['Data']) }))
    .filter(ev => ev._d >= avui && ev._d <= limit)
    .sort((a, b) => a._d - b._d);

  if (futurs.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent =
      'Actualment no hi ha cap esdeveniment futur registrat per als pròxims dos mesos';
    tr.appendChild(td);
    taula.appendChild(tr);
  } else {
    let mesActual = '';
    futurs.forEach(ev => {
      const mes = ev._d.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
      if (mes !== mesActual) {
        mesActual = mes;
        const trMes = document.createElement('tr');
        const thMes = document.createElement('th');
        thMes.colSpan = 3;
        thMes.textContent = mes.charAt(0).toUpperCase() + mes.slice(1);
        trMes.appendChild(thMes);
        taula.appendChild(trMes);
      }

      const tr = document.createElement('tr');

      const tdData = document.createElement('td');
      tdData.textContent = ev._d.toLocaleDateString('ca-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      tr.appendChild(tdData);

      const tdHora = document.createElement('td');
      tdHora.textContent = ev['Hora'] || '';
      tr.appendChild(tdHora);

      const tdTitol = document.createElement('td');
      tdTitol.textContent = ev['Títol'] || '';
      tr.appendChild(tdTitol);

      taula.appendChild(tr);
    });
  }

  cont.appendChild(taula);
}


function mostraEvolucioJugador(jugador, nom) {
  const modalitats = ['3 BANDES', 'BANDA', 'LLIURE'];
  const dadesPerMod = modalitats.map(mod =>
    ranquing
      .filter(r => r.Jugador === jugador && r.Modalitat === mod)
      .map(r => ({ any: parseInt(r.Any, 10), mitjana: parseFloat(r.Mitjana) }))
      .sort((a, b) => a.any - b.any)
  );

  const anys = [...new Set(dadesPerMod.flat().map(d => d.any))].sort(
    (a, b) => a - b
  );

  const colors = ['blue', 'green', 'red'];
  const datasets = modalitats.map((mod, idx) => {
    const values = anys.map(y => {
      const reg = dadesPerMod[idx].find(d => d.any === y);
      return reg ? Number.parseFloat(reg.mitjana) : null;
    });
    return {
      label: mod,
      data: values,
      borderColor: colors[idx],
      backgroundColor: colors[idx],
      tension: 0.2,
      fill: false,
    };
  });

  const canvas = document.getElementById('chart-canvas');
  const overlay = document.getElementById('chart-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
  adjustChartSize();


  const title = document.getElementById('chart-title');
  if (title) {
    title.textContent = nom;
  }

  const ctx = canvas.getContext('2d');
  if (lineChart) {
    lineChart.destroy();
  }
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: anys,
      datasets,
    },
    options: {
      plugins: {
        legend: {
          position: 'right'
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Any' },
          ticks: { stepSize: 1, autoSkip: false }
        },
        y: {
          title: { display: true, text: 'Mitjana' },
          suggestedMin: (() => {
            const all = datasets.flatMap(d => d.data).filter(v => v != null);
            const min = all.length ? Math.min(...all) : 0;
            return Math.floor((min - 0.1) * 10) / 10;
          })(),
          suggestedMax: (() => {
            const all = datasets.flatMap(d => d.data).filter(v => v != null);
            const max = all.length ? Math.max(...all) : 1;
            return Math.ceil((max + 0.1) * 10) / 10;
          })(),
          ticks: { beginAtZero: false, stepSize: 0.1 }

        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

}

document.getElementById('btn-ranking').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'flex';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraRanquing();
});


document.getElementById('btn-agenda').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraAgenda();
});


document.getElementById('btn-classificacio').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'flex';
  document.getElementById('content').style.display = 'block';
  mostraClassificacio();
});

document.getElementById('btn-agenda').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraAgenda();
});


document.getElementById('close-chart').addEventListener('click', () => {

  document.getElementById('chart-overlay').style.display = 'none';

  const title = document.getElementById('chart-title');
  if (title) {
    title.textContent = '';
  }
  if (lineChart) {
    lineChart.destroy();
    lineChart = null;
  }
});

window.addEventListener('resize', () => {
  const overlay = document.getElementById('chart-overlay');
  if (overlay && overlay.style.display !== 'none') {
    adjustChartSize();
  }
});

inicialitza();
