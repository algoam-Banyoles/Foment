import { appendResponsiveTable } from './init.js';

export function mostraCalendari(partides) {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  if (!Array.isArray(partides)) {
    cont.textContent = 'Dades de calendari no vàlides.';
    return;
  }
  const programades = partides.filter(p => p.Data);
  const pendents = partides.filter(p => !p.Data);

  programades.sort((a, b) => {
    const dataDiff = (a.Data || '').localeCompare(b.Data || '');
    if (dataDiff !== 0) return dataDiff;
    const horaDiff = (a.Hora || '').localeCompare(b.Hora || '');
    if (horaDiff !== 0) return horaDiff;
    const billarA = parseInt((a.Billar || '').match(/\d+/), 10) || 0;
    const billarB = parseInt((b.Billar || '').match(/\d+/), 10) || 0;
    return billarA - billarB;
  });

  const filters = document.createElement('div');
  filters.id = 'calendari-filters';
  const input = document.createElement('input');
  input.id = 'calendari-player-filter';
  input.type = 'text';
  input.placeholder = 'Filtre Nom Jugador';
  filters.appendChild(input);
  cont.appendChild(filters);

  const dataContainer = document.createElement('div');
  cont.appendChild(dataContainer);

  const mesos = {
    '01': 'gen',
    '02': 'feb',
    '03': 'mar',
    '04': 'abr',
    '05': 'mai',
    '06': 'jun',
    '07': 'jul',
    '08': 'ago',
    '09': 'set',
    '10': 'oct',
    '11': 'nov',
    '12': 'des'
  };

  function render(filtre = '') {
    filtre = (filtre || '').toLowerCase();
    dataContainer.innerHTML = '';

    const progFiltrades = programades.filter(p => {
      if (!filtre) return true;
      const j1 = (p['Jugador A'] || '').trim().toLowerCase();
      const j2 = (p['Jugador B'] || '').trim().toLowerCase();
      return j1.includes(filtre) || j2.includes(filtre);
    });

    const dayCounts = progFiltrades.reduce((acc, p) => {
      acc[p.Data] = (acc[p.Data] || 0) + 1;
      return acc;
    }, {});

    const taula = document.createElement('table');

    const cap = document.createElement('tr');
    ['Data', 'Hora', 'Billar', 'Jugador A', 'Jugador B'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      cap.appendChild(th);
    });
    taula.appendChild(cap);

    let lastData = null;
    progFiltrades.forEach(p => {
      const tr = document.createElement('tr');
      if (p.Data !== lastData) {
        const tdDia = document.createElement('td');
        const [yyyy, mm, dd] = (p.Data || '').split('-');
        const diaNum = parseInt(dd, 10);

        const diaTxt = mm && diaNum ? `${diaNum}<br>${mesos[mm] || mm}` : '';
        tdDia.innerHTML = diaTxt;

        const count = dayCounts[p.Data];
        if (count > 1) {
          tdDia.rowSpan = count;
          tdDia.classList.add('vertical-text');
        }
        tr.appendChild(tdDia);
        lastData = p.Data;
      }
      const billar = (p.Billar || '').replace('Billar ', 'B');

      let hora = p.Hora || '';
      if (/^\d{1,2}:00$/.test(hora)) {
        hora = hora.split(':')[0];
      }

      [hora, billar, (p['Jugador A'] || '').trim(), (p['Jugador B'] || '').trim()].forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      taula.appendChild(tr);
    });

    appendResponsiveTable(dataContainer, taula);

    const pendFiltrades = pendents
      .filter(p => {
        if (!filtre) return true;
        const j1 = (p['Jugador A'] || '').trim().toLowerCase();
        const j2 = (p['Jugador B'] || '').trim().toLowerCase();
        return j1.includes(filtre) || j2.includes(filtre);
      })
      .sort(
        (a, b) =>
          (parseInt(a.Jornada, 10) || 0) - (parseInt(b.Jornada, 10) || 0)
      );

    if (pendFiltrades.length > 0) {
      const h3 = document.createElement('h3');
      h3.textContent = 'Pendent de programar';
      dataContainer.appendChild(h3);

      const taulaPend = document.createElement('table');
      const capPend = document.createElement('tr');
      ['Jornada', 'J1', 'J2'].forEach(t => {
        const th = document.createElement('th');
        th.textContent = t;
        capPend.appendChild(th);
      });
      taulaPend.appendChild(capPend);

      pendFiltrades.forEach(p => {
        const tr = document.createElement('tr');
        [
          p.Jornada || '',
          (p['Jugador A'] || '').trim(),
          (p['Jugador B'] || '').trim()
        ].forEach(val => {
          const td = document.createElement('td');
          td.textContent = val;
          tr.appendChild(td);
        });
        taulaPend.appendChild(tr);
      });

      appendResponsiveTable(dataContainer, taulaPend);
    }
  }

  input.addEventListener('input', () => {
    render(input.value.trim().toLowerCase());
  });

  render();
}
