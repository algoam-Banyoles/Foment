if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("SW registrat!", reg))
      .catch(err => console.error("Error al registrar el SW:", err));
  });
}
