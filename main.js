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
let agendaMes = new Date().getMonth();
let agendaAny = new Date().getFullYear();
let torneigModalitat = '';

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
      document.getElementById('btn-agenda').click();
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
  const calContainer = document.createElement('div');
  calContainer.id = 'calendar-container';
  const nav = document.createElement('div');
  nav.className = 'calendar-nav';
  const prev = document.createElement('button');
  prev.textContent = '<';
  const next = document.createElement('button');
  next.textContent = '>';
  const label = document.createElement('span');
  label.id = 'calendar-month';
  prev.addEventListener('click', () => {
    agendaMes--;
    if (agendaMes < 0) {
      agendaMes = 11;
      agendaAny--;
    }
    render();
  });
  next.addEventListener('click', () => {
    agendaMes++;
    if (agendaMes > 11) {
      agendaMes = 0;
      agendaAny++;
    }
    render();
  });
  nav.appendChild(prev);
  nav.appendChild(label);
  nav.appendChild(next);
  calContainer.appendChild(nav);
  const calTable = document.createElement('table');
  calTable.className = 'calendar-table';
  const headRow = document.createElement('tr');
  ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].forEach(d => {
    const th = document.createElement('th');
    th.textContent = d;
    headRow.appendChild(th);
  });
  calTable.appendChild(headRow);
  const calBody = document.createElement('tbody');
  calTable.appendChild(calBody);
  calContainer.appendChild(calTable);
  cont.appendChild(calContainer);
  const listTable = document.createElement('table');
  listTable.id = 'event-list';
  listTable.classList.add('agenda-table');
  cont.appendChild(listTable);
  function renderCalendar() {
    calBody.innerHTML = '';
    const first = new Date(agendaAny, agendaMes, 1);
    const start = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(agendaAny, agendaMes + 1, 0).getDate();
    let date = 1;
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < 7; j++) {
        const cell = document.createElement('td');
        if ((i === 0 && j < start) || date > daysInMonth) {
          cell.textContent = '';
        } else {
          const iso = new Date(Date.UTC(agendaAny, agendaMes, date)).toISOString().split('T')[0];
          cell.textContent = date;
          cell.dataset.date = iso;
          const dayEvents = events.filter(ev => ev['Data'] === iso);
          if (dayEvents.length > 0) {
            let cls = 'event-other';
            if (dayEvents.some(ev => ev['Títol'].includes('Fi'))) {
              cls = 'event-fi';
            } else if (dayEvents.some(ev => ev['Títol'].includes('Inici'))) {
              cls = 'event-inici';
            }
            cell.classList.add(cls);
            cell.addEventListener('click', () => highlightEvents(iso));
          }
          date++;
        }
        row.appendChild(cell);
      }
      calBody.appendChild(row);
      if (date > daysInMonth) break;
    }
  }
  function renderList() {
    listTable.innerHTML = '';
    const header = document.createElement('tr');
    ['Data', 'Hora', 'Títol'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      header.appendChild(th);
    });
    listTable.appendChild(header);
    const monthEvents = events
      .filter(ev => {
        const d = new Date(ev['Data']);
        return d.getFullYear() === agendaAny && d.getMonth() === agendaMes;
      })
      .sort((a, b) => new Date(a['Data']) - new Date(b['Data']));
    monthEvents.forEach(ev => {
      const tr = document.createElement('tr');
      tr.dataset.date = ev['Data'];
      ['Data', 'Hora', 'Títol'].forEach(clau => {
        const td = document.createElement('td');
        td.textContent = ev[clau] || '';
        tr.appendChild(td);
      });
      listTable.appendChild(tr);
    });
  }
  function highlightEvents(dateStr) {
    listTable.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected-event'));
    listTable.querySelectorAll(`tr[data-date='${dateStr}']`).forEach(tr => tr.classList.add('selected-event'));
  }
  function render() {
    label.textContent = new Date(agendaAny, agendaMes).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
    renderCalendar();
    renderList();
  }
  render();
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

function mostraTorneig(dades) {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  if (torneigModalitat) {
    const h2 = document.createElement('h2');
    h2.textContent = `Social Modalitat ${torneigModalitat}`;
    cont.appendChild(h2);
  }
  if (!dades) {
    return;
  }
  if (Array.isArray(dades) && dades.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No hi ha dades.';
    cont.appendChild(p);
    return;
  }

  // Nou format: { headers: [...], rows: [...] }
  if (!Array.isArray(dades) && dades.headers && dades.rows) {
    const { headers, rows } = dades;
    const taula = document.createElement('table');
    const cap = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      cap.appendChild(th);
    });
    taula.appendChild(cap);
    rows.forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach((h, idx) => {
        const td = document.createElement('td');
        // cada fila pot ser objecte o array
        td.textContent = (row[h] !== undefined ? row[h] : row[idx]) || '';
        tr.appendChild(td);
      });
      taula.appendChild(tr);
    });
    cont.appendChild(taula);
    return;
  }

  // Format antic: array amb primera fila com a capçalera
  if (Array.isArray(dades) && Array.isArray(dades[0])) {
    const headers = dades[0];
    const taula = document.createElement('table');
    const cap = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      cap.appendChild(th);
    });
    taula.appendChild(cap);
    dades.slice(1).forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach((_, idx) => {
        const td = document.createElement('td');
        td.textContent = row[idx] || '';
        tr.appendChild(td);
      });
      taula.appendChild(tr);
    });
    cont.appendChild(taula);
    return;
  }

  // Per defecte: assumim array d'objectes
  if (Array.isArray(dades) && typeof dades[0] === 'object') {
    const headers = [...new Set(dades.flatMap(obj => Object.keys(obj)))];
    const taula = document.createElement('table');
    const cap = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      cap.appendChild(th);
    });
    taula.appendChild(cap);
    dades.forEach(reg => {
      const tr = document.createElement('tr');
      headers.forEach(h => {
        const td = document.createElement('td');
        td.textContent = reg[h] || '';
        tr.appendChild(td);
      });
      taula.appendChild(tr);
    });
    cont.appendChild(taula);
    return;
  }

  // Fallback: mostra com a JSON
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(dades, null, 2);
  cont.appendChild(pre);
}

document.getElementById('btn-ranking').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'flex';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraRanquing();
});



document.getElementById('btn-classificacio').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'flex';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraClassificacio();
});

document.getElementById('btn-agenda').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraAgenda();
});

document.getElementById('btn-torneig').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'flex';
  const cont = document.getElementById('content');
  cont.style.display = 'block';
  cont.innerHTML = '';
  fetch('data/modalitat.json')
    .then(r => r.json())
    .then(d => {
      torneigModalitat = Array.isArray(d)
        ? d.map(m => m.Modalitat).join(', ')
        : (d.Modalitat || '');
      mostraTorneig();
    })
    .catch(err => {
      console.error('Error carregant modalitat', err);
      cont.innerHTML = '<p>Error carregant modalitat.</p>';
    });
});

document.querySelectorAll('#torneig-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const file = btn.dataset.file;
    fetch(`data/${file}`)
      .then(r => r.json())
      .then(d => mostraTorneig(d))
      .catch(err => {
        console.error('Error carregant dades del torneig', err);
        document.getElementById('content').innerHTML = '<p>Error carregant dades.</p>';
      });
  });
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
