if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("SW registrat!", reg))
      .catch(err => console.error("Error al registrar el SW:", err));
  });
}

function mostraRanquing() {
  fetch('ranquing.json')
    .then(res => res.json())
    .then(dades => {
      const cont = document.getElementById('content');
      cont.innerHTML = '';
      const taula = document.createElement('table');
      const cap = document.createElement('tr');
      ['Any','Modalitat','Posició','Jugador','Mitjana'].forEach(t => {
        const th = document.createElement('th');
        th.textContent = t;
        cap.appendChild(th);
      });
      taula.appendChild(cap);
      dades.forEach(reg => {
        const tr = document.createElement('tr');
        ['Any','Modalitat','Posició','Jugador','Mitjana'].forEach(clau => {
          const td = document.createElement('td');
          td.textContent = reg[clau];
          tr.appendChild(td);
        });
        taula.appendChild(tr);
      });
      cont.appendChild(taula);
    })
    .catch(err => {
      console.error('Error carregant el ranquing', err);
    });
}

document.getElementById('btn-ranking').addEventListener('click', mostraRanquing);
