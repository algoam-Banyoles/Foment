const SERVICE_WORKER_URL = './service-worker.js';

export function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
      if (registration.waiting) {
        console.info('Service worker preparat per actualitzar.');
      } else {
        console.info('Service worker registrat correctament.');
      }
    } catch (error) {
      console.error('No s\'ha pogut registrar el service worker:', error);
    }
  });
}
