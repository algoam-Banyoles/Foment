export async function loadAgenda() {
  try {
    const res = await fetch('/events.json');
    if (!res.ok) throw new Error('Network response was not ok');
    const events = await res.json();

    // Convert current date to Europe/Madrid timezone
    const now = new Date();
    const tzNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));

    // Determine Monday of this week
    const day = tzNow.getDay(); // Sunday=0
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(tzNow);
    monday.setDate(tzNow.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Sunday of next week
    const end = new Date(monday);
    end.setDate(monday.getDate() + 13);
    end.setHours(23, 59, 59, 999);

    const filtered = events.filter(ev => {
      const evDate = new Date(ev.date + 'T00:00:00');
      return evDate >= monday && evDate <= end;
    });

    const container = document.getElementById('agenda');
    if (!container) return;
    container.innerHTML = '';
    if (!filtered.length) {
      container.textContent = 'No hi ha esdeveniments pròxims';
      return;
    }
    const ul = document.createElement('ul');
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    filtered.forEach(ev => {
      const li = document.createElement('li');
      const dateObj = new Date(ev.date + 'T00:00:00');
      const formatted = dateObj.toLocaleDateString('ca-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: '2-digit', month: '2-digit' });
      li.textContent = `${formatted} - ${ev.title}`;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  } catch (err) {
    console.error('Error loading agenda', err);
  }
}

// Auto-load when script is included
loadAgenda();

// Expose for other scripts
if (typeof window !== 'undefined') {
  window.loadAgenda = loadAgenda;
}
