import { setupServiceWorker } from './js/sw-register.js';
import { inicialitza } from './js/init.js';
import { setupRouter } from './js/router.js';
import { closeChart, handleResize } from './js/graficos.js';

setupServiceWorker();
setupRouter();

document.getElementById('close-chart').addEventListener('click', closeChart);
window.addEventListener('resize', handleResize);

inicialitza();
