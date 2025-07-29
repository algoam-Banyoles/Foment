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

function inicialitza() {
  Promise.all([
    fetch('ranquing.json').then(r => r.json()),
    fetch('classificacions.json').then(r => r.json()).catch(() => [])
  ])
    .then(([dadesRanking, dadesClass]) => {
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
          mostraEvolucioJugador(reg.Jugador, reg.NomComplet, modalitatSeleccionada);
        });
      }
      tr.appendChild(td);

    });
    tr.addEventListener('click', () => {
      mostraEvolucioJugador(reg.Jugador, reg.NomComplet, modalitatSeleccionada);
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


function mostraEvolucioJugador(jugador, nom, modalitat) {
  const dades = ranquing
    .filter(r => r.Jugador === jugador && r.Modalitat === modalitat)
    .map(r => ({ any: parseInt(r.Any, 10), mitjana: parseFloat(r.Mitjana) }))
    .sort((a, b) => a.any - b.any);

  const firstYear = dades.length > 0 ? dades[0].any : null;
  const lastYear = dades.length > 0 ? dades[dades.length - 1].any : null;
  const labels = [];
  const values = [];
  if (firstYear !== null && lastYear !== null) {
    for (let y = firstYear; y <= lastYear; y++) {
      labels.push(y);
      const reg = dades.find(d => d.any === y);
      values.push(reg ? Number.parseFloat(reg.mitjana) : null);
    }
  }

  const canvas = document.getElementById('chart-canvas');
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const size = vmin * 0.9;
  const chartContainer = document.getElementById('player-chart');
  if (chartContainer) {
    chartContainer.style.width = size + 'px';
    chartContainer.style.maxWidth = size + 'px';
  }
  canvas.width = size;
  canvas.height = size * 0.6;

  const title = document.getElementById('chart-title');
  if (title) {
    title.textContent = nom + ' - ' + modalitat;
  }

  const ctx = canvas.getContext('2d');
  if (lineChart) {
    lineChart.destroy();
  }
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: nom + ' - ' + modalitat,
        data: values,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        tension: 0.2,
        fill: false
      }]
    },
    options: {
      scales: {
        x: {
          title: { display: true, text: 'Any' },
          ticks: { stepSize: 1 }
        },
        y: {
          title: { display: true, text: 'Mitjana' },
          min: 0,
          ticks: { beginAtZero: true }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  document.getElementById('chart-overlay').style.display = 'flex';
}

document.getElementById('btn-ranking').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'flex';
  document.getElementById('classificacio-filters').style.display = 'none';
  mostraRanquing();
});

document.getElementById('btn-update').addEventListener('click', () => {
  fetch('/update-ranking')
    .then(res => {
      if (!res.ok) throw new Error('Error actualitzant el r\xe0nquing');
      return res.json();
    })
    .then(() => {
      inicialitza();
    })
    .catch(err => {
      console.error(err);
      alert('No s\'ha pogut actualitzar el r\xe0nquing');
    });
});

document.getElementById('btn-classificacio').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'none';
  document.getElementById('classificacio-filters').style.display = 'flex';
  mostraClassificacio();
});

document.getElementById('btn-update-classificacio').addEventListener('click', () => {
  fetch('/update-classificacions')
    .then(res => {
      if (!res.ok) throw new Error('Error actualitzant classificacions');
      return res.json();
    })
    .then(() => {
      inicialitza();
    })
    .catch(err => {
      console.error(err);
      alert('No s\'ha pogut actualitzar les classificacions');
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

inicialitza();
