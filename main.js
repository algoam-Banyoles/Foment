if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Register using a relative path so it also works when the site
    // is served from a sub directory (e.g. GitHub Pages)
    navigator.serviceWorker.register("./service-worker.js")
      .then(reg => console.log("SW registrat!", reg))
      .catch(err => console.error("Error al registrar el SW:", err));
  });
}

let ranquing = [];
let anys = [];
let anySeleccionat = null;
let modalitatSeleccionada = '3 BANDES';

function inicialitza() {
  fetch('ranquing.json')
    .then(res => res.json())
    .then(dades => {
      ranquing = dades;
      // Map the years to numbers for a proper sort and comparison
      anys = [...new Set(dades.map(d => parseInt(d.Any, 10)))]
        .sort((a, b) => a - b);
      anySeleccionat = anys[anys.length - 1];
      preparaSelectors();
    })
    .catch(err => {
      console.error('Error carregant el ranquing', err);
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
        valor = reg[clau];
      }
      td.textContent = valor;
      tr.appendChild(td);

    });
    taula.appendChild(tr);
  });
  cont.appendChild(taula);
}

function mostraEvolucioJugador(jugador, modalitat) {
  const dades = ranquing
    .filter(r => r.Jugador === jugador && r.Modalitat === modalitat)
    .map(r => ({ any: parseInt(r.Any, 10), mitjana: parseFloat(r.Mitjana) }))
    .sort((a, b) => a.any - b.any);
  const labels = dades.map(d => d.any);
  const values = dades.map(d => Number.parseFloat(d.mitjana).toFixed(3));
  const canvas = document.getElementById('chart-canvas');
  if (window.playerChart) {
    window.playerChart.destroy();
  }
  window.playerChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: jugador + ' - ' + modalitat,
        data: values,
        fill: false,
        borderColor: 'blue'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
  document.getElementById('player-chart').style.display = 'flex';
}

document.getElementById('btn-ranking').addEventListener('click', () => {
  document.getElementById('filters-row').style.display = 'flex';
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

document.getElementById('close-chart').addEventListener('click', () => {
  document.getElementById('player-chart').style.display = 'none';
});

inicialitza();
