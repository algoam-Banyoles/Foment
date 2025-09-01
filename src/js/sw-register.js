export function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js', { updateViaCache: 'none' })
        .then((reg) => {
          console.log('SW registrat!', reg);
          const checkForUpdate = () => {
            reg.update().then(() => {
              if (reg.waiting && confirm('Nova versió disponible. Actualitzar?')) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          };

          checkForUpdate();
          setInterval(checkForUpdate, 24 * 60 * 60 * 1000);

          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NEW_VERSION') {
              alert('Aplicació actualitzada');
            }
          });

          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
          });
        })
        .catch((err) => console.error('Error al registrar el SW:', err));
    });
  }
}
