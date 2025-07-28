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
    tr.addEventListener('click', () => {
      mostraEvolucioJugador(reg.Jugador, modalitatSeleccionada);
    });
    taula.appendChild(tr);
  });
  cont.appendChild(taula);
}

function drawLineChart(canvas, labels, data, label) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  const pad = 40;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const minY = Math.min(...data);
  const maxY = Math.max(...data);
  const range = maxY - minY || 1;

  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + h);
  ctx.lineTo(pad + w, pad + h);
  ctx.stroke();

  ctx.strokeStyle = 'blue';
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = pad + (w * i) / (data.length - 1);
    const y = pad + h - ((v - minY) / range) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  labels.forEach((lab, i) => {
    const x = pad + (w * i) / (labels.length - 1);
    ctx.fillText(lab, x, pad + h + 5);
  });

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = minY + (range * i) / steps;
    const y = pad + h - (h * i) / steps;
    ctx.fillText(val.toFixed(2), pad - 5, y);
  }
}

function mostraEvolucioJugador(jugador, modalitat) {
  const dades = ranquing
    .filter(r => r.Jugador === jugador && r.Modalitat === modalitat)
    .map(r => ({ any: parseInt(r.Any, 10), mitjana: parseFloat(r.Mitjana) }))
    .sort((a, b) => a.any - b.any);
  const labels = dades.map(d => d.any);
  const values = dades.map(d => Number.parseFloat(d.mitjana));
  const canvas = document.getElementById('chart-canvas');
  if (!canvas.width) {
    canvas.width = 400;
    canvas.height = 300;
  }
  drawLineChart(canvas, labels, values, jugador + ' - ' + modalitat);
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
