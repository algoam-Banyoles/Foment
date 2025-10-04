let deferredPrompt = null;

export function setupInstallPrompt() {
  const installButton = document.querySelector('[data-install]');
  if (!installButton) return;

  const hideButton = () => {
    installButton.hidden = true;
    installButton.disabled = false;
  };

  const showButton = () => {
    installButton.hidden = false;
    installButton.disabled = false;
  };

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) {
    hideButton();
  } else {
    installButton.hidden = true;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showButton();
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    installButton.disabled = true;

    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      deferredPrompt = null;
      hideButton();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideButton();
  });
}
