export const state = {
  ranquing: [],
  anys: [],
  anySeleccionat: null,
  modalitatSeleccionada: '3 BANDES',
  lineChart: null,
  classificacions: [],
  classYears: [],
  classAnySeleccionat: null,
  classModalitatSeleccionada: '3 BANDES',
  classCategoriaSeleccionada: null,
  events: [],
  isAdmin: false,
  agendaSetmanaInici: (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  })(),
  torneigModalitat: '',
  torneigCaramboles: {},
  torneigCategoriaSeleccionada: null,
};

export function setLineChart(chart) {
  state.lineChart = chart;
}

export function appendResponsiveTable(container, table) {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-responsive';
  wrapper.appendChild(table);
  container.appendChild(wrapper);
}

export function adjustChartSize() {
  const chartContainer = document.getElementById('player-chart');
  if (chartContainer) {
    chartContainer.style.width = '90vw';
    chartContainer.style.height = '96vh';
  }
  const canvas = document.getElementById('chart-canvas');
  if (canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }
  if (state.lineChart) {
    state.lineChart.resize();
  }
}
