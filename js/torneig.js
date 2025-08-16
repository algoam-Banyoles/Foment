import { preparaTorneigCategories, appendResponsiveTable, torneigCategoriaSeleccionada, torneigCaramboles } from './init.js';
import { mostraCalendari } from './calendari.js';
import { mostraPartides } from './partides.js';

export function mostraTorneig(dades, file) {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  const catCont = document.getElementById('torneig-category-buttons');
  catCont.style.display = 'none';
  catCont.innerHTML = '';

  if (file === 'calendari.json') {
    mostraCalendari(dades);
    return;
  }

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

  if (
    file !== 'classificacio.json' &&
    Array.isArray(dades) &&
    dades[0] &&
    (('Categoria jugador' in dades[0] && 'Nom jugador' in dades[0]) ||
      ('Categoria' in dades[0] && 'Nom' in dades[0]))
  ) {
    const catField = 'Categoria jugador' in dades[0] ? 'Categoria jugador' : 'Categoria';
    const nomField = 'Nom jugador' in dades[0] ? 'Nom jugador' : 'Nom';
    const agrupats = dades.reduce((acc, reg) => {
      const cat = reg[catField];
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push((reg[nomField] || '').trim());
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

  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(dades, null, 2);
  cont.appendChild(pre);
}
