export async function renderAgenda() {
  const cont = document.getElementById('agenda');
  if (!cont) return;
  cont.textContent = 'Carregant...';

  try {
    const res = await fetch('agenda.json');
    if (!res.ok) throw new Error('Bad response');
    const events = await res.json();

    if (!Array.isArray(events) || events.length === 0) {
      cont.textContent = 'No hi ha esdeveniments.';
      return;
    }

    const fmt = new Intl.DateTimeFormat('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const ul = document.createElement('ul');
    for (const ev of events) {
      const li = document.createElement('li');
      const when = new Date(ev.date || ev.data || ev.start || ev.inici);
      const title = ev.name || ev.titol || ev.summary || '';
      li.textContent = `${fmt.format(when)} - ${title}`;
      ul.appendChild(li);
    }
    cont.innerHTML = '';
    cont.appendChild(ul);
  } catch (err) {
    console.error('Error carregant agenda', err);
    cont.textContent = 'No hi ha esdeveniments.';
  }
}

renderAgenda();
