import { classificacions, classAnySeleccionat, classModalitatSeleccionada, classCategoriaSeleccionada, appendResponsiveTable } from './init.js';

export function mostraClassificacio() {
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
