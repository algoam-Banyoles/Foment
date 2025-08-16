import { appendResponsiveTable, torneigCategoriaSeleccionada } from './init.js';

export function mostraPartides(partides) {
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
  input.placeholder = 'Filtre Nom Jugador';
  filters.appendChild(input);

  cont.appendChild(filters);

  const list = document.createElement('div');
  cont.appendChild(list);

  function render(filtre = '') {
    filtre = (filtre || '').toLowerCase();
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
