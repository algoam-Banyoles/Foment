export function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
          console.log('SW registrat!', reg);
          const checkForUpdate = () => {
            reg.update().then(() => {
              if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          };

          checkForUpdate();
          setInterval(checkForUpdate, 24 * 60 * 60 * 1000);
        })
        .catch(err => console.error('Error al registrar el SW:', err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    });
  }
}
