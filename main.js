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
      mostraRanquing();
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
  ['Any', 'Modalitat', 'Posició', 'Jugador', 'Mitjana'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    cap.appendChild(th);
  });
  taula.appendChild(cap);
  ranquing
    .filter(reg =>
      parseInt(reg.Any, 10) === anySeleccionat &&
      reg.Modalitat === modalitatSeleccionada)
    .forEach(reg => {
      const tr = document.createElement('tr');
      ['Any', 'Modalitat', 'Posició', 'Jugador', 'Mitjana'].forEach(clau => {
        const td = document.createElement('td');
        let valor = reg[clau];
        if (clau === 'Mitjana') {
          valor = Number.parseFloat(reg[clau]).toFixed(3);
        }
        td.textContent = valor;
        tr.appendChild(td);
      });
      taula.appendChild(tr);
    });
  cont.appendChild(taula);
}

document.getElementById('btn-ranking').addEventListener('click', mostraRanquing);

inicialitza();
