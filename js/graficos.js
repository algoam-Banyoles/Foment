import { ranquing, lineChart, setLineChart, adjustChartSize } from './init.js';

let lastFocusedElement = null;

export function mostraEvolucioJugador(jugador, nom) {
  const modalitats = ['3 BANDES', 'BANDA', 'LLIURE'];
  const dadesPerMod = modalitats.map(mod =>
    ranquing
      .filter(r => r.Jugador === jugador && r.Modalitat === mod)
      .map(r => ({ any: parseInt(r.Any, 10), mitjana: parseFloat(r.Mitjana) }))
      .sort((a, b) => a.any - b.any)
  );

  const anys = [...new Set(dadesPerMod.flat().map(d => d.any))].sort(
    (a, b) => a - b
  );

  const colors = ['blue', 'green', 'red'];
  const datasets = modalitats.map((mod, idx) => {
    const values = anys.map(y => {
      const reg = dadesPerMod[idx].find(d => d.any === y);
      return reg ? Number.parseFloat(reg.mitjana) : null;
    });
    return {
      label: mod,
      data: values,
      borderColor: colors[idx],
      backgroundColor: colors[idx],
      tension: 0.2,
      fill: false,
    };
  });

  const canvas = document.getElementById('chart-canvas');
  const overlay = document.getElementById('chart-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    lastFocusedElement = document.activeElement;
  }
  const closeBtn = document.getElementById('close-chart');
  if (closeBtn) {
    closeBtn.focus();
  }
  adjustChartSize();

  const title = document.getElementById('chart-title');
  if (title) {
    title.textContent = nom;
  }

  const ctx = canvas.getContext('2d');
  if (lineChart) {
    lineChart.destroy();
  }
  setLineChart(new Chart(ctx, {
    type: 'line',
    data: {
      labels: anys,
      datasets,
    },
    options: {
      plugins: {
        legend: {
          position: 'right'
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Any' },
          ticks: { stepSize: 1, autoSkip: false }
        },
        y: {
          title: { display: true, text: 'Mitjana' },
          suggestedMin: (() => {
            const all = datasets.flatMap(d => d.data).filter(v => v != null);
            const min = all.length ? Math.min(...all) : 0;
            return Math.floor((min - 0.1) * 10) / 10;
          })(),
          suggestedMax: (() => {
            const all = datasets.flatMap(d => d.data).filter(v => v != null);
            const max = all.length ? Math.max(...all) : 1;
            return Math.ceil((max + 0.1) * 10) / 10;
          })(),
          ticks: { beginAtZero: false, stepSize: 0.1 }

        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  }));
}

export function closeChart() {
  document.getElementById('chart-overlay').style.display = 'none';
  const title = document.getElementById('chart-title');
  if (title) {
    title.textContent = '';
  }
  if (lineChart) {
    lineChart.destroy();
    setLineChart(null);
  }
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

export function handleResize() {
  const overlay = document.getElementById('chart-overlay');
  if (overlay && overlay.style.display !== 'none') {
    adjustChartSize();
  }
}
