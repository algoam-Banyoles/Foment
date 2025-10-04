export function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length === 0) {
          console.info('Cap service worker actiu. No cal desactivar res.');
          return;
        }

        registrations.forEach((registration) => {
          registration
            .unregister()
            .then((success) => {
              if (success) {
                console.info('Service worker desactivat');
              }
            })
            .catch((err) => console.error('No s\'ha pogut desregistrar el service worker:', err));
        });
      })
      .catch((err) => console.error('No s\'han pogut recuperar els service workers actius:', err));
  });
}
