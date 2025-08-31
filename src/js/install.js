let deferredPrompt;

export function setupInstallPrompt() {
  const installBtn = document.getElementById('btn-install');
  if (!installBtn) return;

  installBtn.style.display = 'none';

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}
