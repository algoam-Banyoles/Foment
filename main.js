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
let torneigCaramboles = {};
let torneigCategoriaSeleccionada = null;

function appendResponsiveTable(container, table) {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-responsive';
  wrapper.appendChild(table);
  container.appendChild(wrapper);
}

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

function preparaTorneigCategories(categories, render) {
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
  appendResponsiveTable(cont, taula);
}

function mostraClassificacio() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  const taula = document.createElement('table');
  const cap = document.createElement('tr');
  ['#', 'Jugador', 'PJ', 'P', 'C', 'E', 'MG', 'MM'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    cap.appendChild(th);
  });
  taula.appendChild(cap);

  const dades = classificacions
    .filter(
      r =>
        parseInt(r.Any, 10) === classAnySeleccionat &&
        r.Modalitat === classModalitatSeleccionada &&
        r.Categoria === classCategoriaSeleccionada
    )
    .sort((a, b) => parseInt(a.Posició, 10) - parseInt(b.Posició, 10));

  dades.forEach(reg => {
    const tr = document.createElement('tr');
    const camps = [
      reg['Posició'],
      reg['Jugador'] || reg['Nom'] || '',
      reg['PartidesJugades'] || reg['Partides jugades'] || reg['PJ'] || '',
      reg['Punts'],
      reg['Caramboles'],
      reg['Entrades'],
      reg['MitjanaGeneral'] || reg['Mitjana'] || '',
      reg['MitjanaParticular'] || reg['Millor mitjana'] || ''
    ];
    camps.forEach((valor, idx) => {
      const td = document.createElement('td');
      if (idx >= 6 && valor !== '') {
        const num = Number.parseFloat(valor);
        valor = Number.isNaN(num) ? valor : num.toFixed(3);
      }
      td.textContent = valor;
      tr.appendChild(td);
    });
    taula.appendChild(tr);
  });
  appendResponsiveTable(cont, taula);
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
  appendResponsiveTable(calContainer, calTable);
  cont.appendChild(calContainer);
  const listTable = document.createElement('table');
  listTable.id = 'event-list';
  listTable.classList.add('agenda-table');
  appendResponsiveTable(cont, listTable);
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

function mostraHorari() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  const ul = document.createElement('ul');
  const hores = [
    ['Dilluns', '9:00 a 21:30'],
    ['Dimarts', '10:30 a 21:30'],
    ['Dimecres', '9:00 a 21:30'],
    ['Dijous', '9:00 a 21:30'],
    ['Divendres', '10:30 a 21:30'],
    ['Dissabte', '9:00 a 21:30'],
    ['Diumenge', '9:00 a 21:30']
  ];
  hores.forEach(([dia, hora]) => {
    const li = document.createElement('li');
    li.textContent = `${dia}: ${hora}`;
    ul.appendChild(li);
  });
  cont.appendChild(ul);

  const pAgost = document.createElement('p');
  pAgost.textContent = 'Agost tancat';
  cont.appendChild(pAgost);

  const pNotes = document.createElement('p');
  pNotes.textContent =
    "Aquests horaris poden patir alteracions en funció dels horaris d'obertura del bar del Foment.";
  cont.appendChild(pNotes);
}

function mostraEnllacos() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  const ul = document.createElement('ul');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = 'https://www.fomentmartinenc.org/';
  a.textContent = 'Foment Martinenc';
  a.target = '_blank';
  li.appendChild(a);
  ul.appendChild(li);
  cont.appendChild(ul);
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

function mostraPartides(partides) {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  if (!Array.isArray(partides)) {
    cont.textContent = 'Dades de partides no vàlides.';
    return;
  }

  partides.sort((a, b) => {
    const dateA = new Date(a.Timestamp);
    const dateB = new Date(b.Timestamp);
    return dateB - dateA;
  });

  const filters = document.createElement('div');
  filters.id = 'partides-filters';

  const input = document.createElement('input');
  input.id = 'partides-player-filter';
  input.type = 'text';
  input.placeholder = 'Nom del jugador';
  filters.appendChild(input);

  cont.appendChild(filters);

  const list = document.createElement('div');
  cont.appendChild(list);

  function render(filtre = '') {
    list.innerHTML = '';
    const filtered = partides
      .filter(p => p["🏆 Categoria de la partida"] === torneigCategoriaSeleccionada)
      .filter(p => {
        if (!filtre) return true;
        const nom1 = (p["🎱 Nom del Jugador 1"] || '').trim().toLowerCase();
        const nom2 = (p["🎱 Nom del Jugador 2"] || '').trim().toLowerCase();
        return nom1.includes(filtre) || nom2.includes(filtre);
      });

    filtered.forEach((p, idx) => {
      const nom1 = (p["🎱 Nom del Jugador 1"] || '').trim();
      const nom2 = (p["🎱 Nom del Jugador 2"] || '').trim();
      const car1 = parseInt(p["🔢 Caramboles del Jugador 1"], 10) || 0;
      const car2 = parseInt(p["🔢 Caramboles del Jugador 2"], 10) || 0;
      const entrades = p["⏱️ Entrades de la partida"] || '';
      const mitj1 = (parseFloat(p["Mitjana J1"]) || 0).toFixed(3);
      const mitj2 = (parseFloat(p["Mitjana J2"]) || 0).toFixed(3);
      const emoji1 = car1 > car2 ? ' 🏆' : '';
      const emoji2 = car2 > car1 ? ' 🏆' : '';

      const table = document.createElement('table');
      table.className = 'partida';

      const colgroup = document.createElement('colgroup');
      ['jugadors', 'c', 'e', 'm'].forEach(cl => {
        const col = document.createElement('col');
        col.className = cl;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);

      if (idx === 0) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Jugadors', 'C', 'E', 'M'].forEach(text => {
          const th = document.createElement('th');
          th.textContent = text;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
      }

      const tbody = document.createElement('tbody');
      const tr1 = document.createElement('tr');
      const tr2 = document.createElement('tr');

      const tdNom1 = document.createElement('td');
      tdNom1.textContent = `${nom1}${emoji1}`;
      const tdCar1 = document.createElement('td');
      tdCar1.textContent = car1;
      const tdEntr = document.createElement('td');
      tdEntr.textContent = entrades;
      tdEntr.rowSpan = 2;
      const tdMitj1 = document.createElement('td');
      tdMitj1.textContent = mitj1;

      tr1.appendChild(tdNom1);
      tr1.appendChild(tdCar1);
      tr1.appendChild(tdEntr);
      tr1.appendChild(tdMitj1);

      const tdNom2 = document.createElement('td');
      tdNom2.textContent = `${nom2}${emoji2}`;
      const tdCar2 = document.createElement('td');
      tdCar2.textContent = car2;
      const tdMitj2 = document.createElement('td');
      tdMitj2.textContent = mitj2;

      tr2.appendChild(tdNom2);
      tr2.appendChild(tdCar2);
      tr2.appendChild(tdMitj2);

      tbody.appendChild(tr1);
      tbody.appendChild(tr2);
      table.appendChild(tbody);
      appendResponsiveTable(list, table);
    });
  }

  input.addEventListener('input', () => {
    render(input.value.trim().toLowerCase());
  });

  render();
}

function mostraTorneig(dades, file) {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  const catCont = document.getElementById('torneig-category-buttons');
  catCont.style.display = 'none';
  catCont.innerHTML = '';

  if (file === 'partides.json') {
    const categories = [...new Set(dades.map(p => p["🏆 Categoria de la partida"]))];
    preparaTorneigCategories(categories, () => mostraPartides(dades));
    return;
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

  // Format específic per als inscrits: array d'objectes amb categoria i nom
  if (Array.isArray(dades) && dades[0] && 'Categoria jugador' in dades[0] && 'Nom jugador' in dades[0]) {
    const agrupats = dades.reduce((acc, reg) => {
      const cat = reg['Categoria jugador'];
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push((reg['Nom jugador'] || '').trim());
      return acc;
    }, {});
    const categories = Object.keys(agrupats);
    const render = () => {
      cont.innerHTML = '';
      const cat = torneigCategoriaSeleccionada;
      const h3 = document.createElement('h3');
      const car = torneigCaramboles[cat];
      h3.textContent = car
        ? `${cat}a categoria (${car} caramboles)`
        : `${cat}a categoria`;
      cont.appendChild(h3);
      const ul = document.createElement('ul');
      (agrupats[cat] || []).forEach(nom => {
        const li = document.createElement('li');
        li.textContent = nom;
        ul.appendChild(li);
      });
      cont.appendChild(ul);
    };
    preparaTorneigCategories(categories, render);
    return;
  }

  // Format específic per a la classificació del torneig
  if (file === 'classificacio.json' && Array.isArray(dades) && dades[0] && 'Posició' in dades[0]) {
    const agrupats = dades.reduce((acc, reg) => {
      const cat = reg.Categoria || '';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(reg);
      return acc;
    }, {});
    const categories = Object.keys(agrupats);
    const render = () => {
      cont.innerHTML = '';
      const cat = torneigCategoriaSeleccionada;
      const h3 = document.createElement('h3');
      const car = torneigCaramboles[cat];
      h3.textContent = car
        ? `${cat}a categoria (${car} caramboles)`
        : `${cat}a categoria`;
      cont.appendChild(h3);
      const taula = document.createElement('table');
      const cap = document.createElement('tr');
      ['#', 'Jugador', 'PJ', 'P', 'C', 'E', 'MG', 'MM'].forEach(t => {
        const th = document.createElement('th');
        th.textContent = t;
        cap.appendChild(th);
      });
      taula.appendChild(cap);
      (agrupats[cat] || [])
        .sort((a, b) => {
          const puntsA = parseInt(a['Punts'], 10) || 0;
          const puntsB = parseInt(b['Punts'], 10) || 0;
          if (puntsB !== puntsA) return puntsB - puntsA;
          const mitjanaA = parseFloat(a['MitjanaGeneral'] || a['Mitjana'] || '0');
          const mitjanaB = parseFloat(b['MitjanaGeneral'] || b['Mitjana'] || '0');
          return mitjanaB - mitjanaA;
        })
        .forEach((reg, idx) => {
          const tr = document.createElement('tr');
          const camps = [
            idx + 1,
            reg['Nom'] || '',
            reg['PartidesJugades'] || reg['Partides jugades'] || reg['PJ'] || '',
            reg['Punts'],
            reg['Caramboles'],
            reg['Entrades'],
            reg['MitjanaGeneral'] || reg['Mitjana'] || '',
            reg['MitjanaParticular'] || reg['Millor mitjana'] || ''
          ];
          camps.forEach((valor, idx) => {
            const td = document.createElement('td');
            if (idx >= 6 && valor !== '') {
              const num = Number.parseFloat(valor);
              valor = Number.isNaN(num) ? valor : num.toFixed(3);
            }
            td.textContent = valor;
            tr.appendChild(td);
          });
          taula.appendChild(tr);
        });
      appendResponsiveTable(cont, taula);
    };
    preparaTorneigCategories(categories, render);
    return;
  }

  // Altres formats amb camp Categoria
  if (Array.isArray(dades) && dades[0] && 'Categoria' in dades[0]) {
    const agrupats = dades.reduce((acc, reg) => {
      const cat = reg.Categoria || '';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(reg);
      return acc;
    }, {});
    const headers = Object.keys(dades[0]).filter(h => h !== 'Categoria');
    const categories = Object.keys(agrupats);
    const render = () => {
      cont.innerHTML = '';
      const cat = torneigCategoriaSeleccionada;
      const h3 = document.createElement('h3');
      const car = torneigCaramboles[cat];
      h3.textContent = car
        ? `${cat}a categoria (${car} caramboles)`
        : `${cat}a categoria`;
      cont.appendChild(h3);
      const taula = document.createElement('table');
      const cap = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        cap.appendChild(th);
      });
      taula.appendChild(cap);
      (agrupats[cat] || []).forEach(reg => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
          const td = document.createElement('td');
          td.textContent = reg[h] || '';
          tr.appendChild(td);
        });
        taula.appendChild(tr);
      });
      appendResponsiveTable(cont, taula);
    };
    preparaTorneigCategories(categories, render);
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
    appendResponsiveTable(cont, taula);
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
    appendResponsiveTable(cont, taula);
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
    appendResponsiveTable(cont, taula);
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
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraRanquing();
});



document.getElementById('btn-classificacio').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'flex';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraClassificacio();
});

document.getElementById('btn-agenda').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraAgenda();
});

document.getElementById('btn-horari').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraHorari();
});

document.getElementById('btn-enllacos').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'none';
  document.getElementById('torneig-title').style.display = 'none';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  mostraEnllacos();
});

document.getElementById('btn-torneig').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'none';
  document.getElementById('torneig-buttons').style.display = 'flex';
  document.getElementById('torneig-category-buttons').style.display = 'none';
  torneigCategoriaSeleccionada = null;
  const title = document.getElementById('torneig-title');
  const cont = document.getElementById('content');
  cont.style.display = 'block';
  cont.innerHTML = '';
  fetch('data/modalitat.json')
    .then(r => r.json())
    .then(d => {
      const modalObj = Array.isArray(d) ? (d[0] || {}) : (d || {});
      torneigCaramboles = {};
      Object.keys(modalObj).forEach(k => {
        const m = k.match(/^(\d+)a$/);
        if (m) {
          torneigCaramboles[m[1]] = modalObj[k];
        }
      });
      torneigModalitat = Array.isArray(d)
        ? d.map(m => m.Modalitat).join(', ')
        : (d.Modalitat || '');
      title.textContent = `Social Modalitat ${torneigModalitat}`;
      title.style.display = 'block';
    })
    .catch(err => {
      console.error('Error carregant modalitat', err);
      cont.innerHTML = '<p>Error carregant modalitat.</p>';
      title.style.display = 'none';
    });
});

document.querySelectorAll('#torneig-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const file = btn.dataset.file;
    fetch(`data/${file}`)
      .then(r => r.json())
      .then(d => mostraTorneig(d, file))
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
