export function setupIframeExperiment() {
  const iframeContainer = document.getElementById('iframe-experiment');
  const appContainer = document.getElementById('app');
  const showOriginalButton = document.getElementById('show-original-app');
  const reopenExperimentButton = document.getElementById('show-iframe-experiment');

  if (!iframeContainer || !appContainer || !showOriginalButton) {
    return;
  }

  const openExperiment = () => {
    iframeContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
  };

  const closeExperiment = () => {
    iframeContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
  };

  showOriginalButton.addEventListener('click', closeExperiment);

  if (reopenExperimentButton) {
    reopenExperimentButton.addEventListener('click', openExperiment);
  }

  openExperiment();
}
