import { state, appendResponsiveTable } from './state.js';

export function mostraAgenda() {
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
    state.agendaSetmanaInici.setDate(state.agendaSetmanaInici.getDate() - 7);
    render();
  });
  next.addEventListener('click', () => {
    state.agendaSetmanaInici.setDate(state.agendaSetmanaInici.getDate() + 7);
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

  const today = new Date();
  let selectedDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
    .toISOString()
    .split('T')[0];

  function renderCalendar() {
    calBody.innerHTML = '';
    const row = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
      const cell = document.createElement('td');
      const date = new Date(state.agendaSetmanaInici);
      date.setDate(state.agendaSetmanaInici.getDate() + i);
      const iso = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        .toISOString()
        .split('T')[0];
      cell.textContent = date.getDate();
      cell.dataset.date = iso;
      const dayEvents = state.events.filter(ev => ev['Data'] === iso);
      if (dayEvents.length > 0) {
        let cls = 'event-other';
        if (dayEvents.some(ev => ev.Categoria === 'festiu')) {
          cls = 'event-festiu';
        } else if (dayEvents.some(ev => ev.Categoria === 'assemblea')) {
          cls = 'event-assemblea';
        } else if (dayEvents.some(ev => ev.Categoria === 'partida')) {
          cls = 'event-partida';
        } else if (dayEvents.some(ev => ev['Títol'].includes('Fi'))) {
          cls = 'event-fi';
        } else if (dayEvents.some(ev => ev['Títol'].includes('Inici'))) {
          cls = 'event-inici';
        }
        cell.classList.add(cls);
      }
      if (iso === selectedDate) {
        cell.classList.add('selected-day');
      }
      cell.addEventListener('click', () => {
        selectedDate = iso;
        render();
      });
      row.appendChild(cell);
    }
    calBody.appendChild(row);
  }

  function renderList() {
    listTable.innerHTML = '';
    const header = document.createElement('tr');
    ['Data', 'Títol'].forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      header.appendChild(th);
    });
    listTable.appendChild(header);
    const dayEvents = state.events
      .filter(ev => ev['Data'] === selectedDate)
      .sort((a, b) => (a['Hora'] || '').localeCompare(b['Hora'] || ''));
    dayEvents.forEach(ev => {
      const tr = document.createElement('tr');
      tr.dataset.date = ev['Data'];
      let cls = 'event-other';
      if (ev.Categoria === 'festiu') {
        cls = 'event-festiu';
      } else if (ev.Categoria === 'assemblea') {
        cls = 'event-assemblea';
      } else if (ev.Categoria === 'partida') {
        cls = 'event-partida';
      } else if (ev['Títol'].includes('Fi')) {
        cls = 'event-fi';
      } else if (ev['Títol'].includes('Inici')) {
        cls = 'event-inici';
      }
      tr.classList.add(cls);
      ['Data', 'Títol'].forEach(clau => {
        const td = document.createElement('td');
        if (clau === 'Data') {
          const [y, m, d] = (ev['Data'] || '').split('-');
          td.textContent = `${d}/${m}`;
        } else {
          const text = ev[clau] || '';
          const tipus = (ev.Tipus || '').toLowerCase();
          if (tipus === 'confirmat') {
            td.innerHTML = `<strong>${text}</strong>`;
          } else if (tipus === 'previsió' || tipus === 'previsio') {
            td.innerHTML = `<em>${text} (previsió)</em>`;
          } else {
            td.textContent = text;
          }
        }
        tr.appendChild(td);
      });
      listTable.appendChild(tr);
    });
  }

  function render() {
    const end = new Date(state.agendaSetmanaInici);
    end.setDate(state.agendaSetmanaInici.getDate() + 6);
    const weekEnd = new Date(state.agendaSetmanaInici);
    weekEnd.setDate(state.agendaSetmanaInici.getDate() + 7);
    if (new Date(selectedDate) < state.agendaSetmanaInici || new Date(selectedDate) >= weekEnd) {
      selectedDate = state.agendaSetmanaInici.toISOString().split('T')[0];
    }
    const startStr = state.agendaSetmanaInici.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    label.textContent = `${startStr} - ${endStr}`;
    renderCalendar();
    renderList();
  }

  render();
}
