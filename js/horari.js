export function mostraHorari() {
  const cont = document.getElementById('content');
  cont.innerHTML = `
<div class="normes-container">
  <h2 class="normes-title">Normes d’ús i horari</h2>

  <!-- Horari -->
  <div class="normes-card horari">
    <h3>🕒 Horari d'obertura de la Secció</h3>
    <ul>
      <li><b>Dilluns, dimecres, dijous, dissabte i diumenge:</b> 9:00 – 21:30</li>
      <li><b>Dimarts i divendres:</b> 10:30 – 21:30</li>
      <li>L'horari d'obertura pot canviar en funció dels horaris d'obertura del <b>Bar del Foment</b>.</li>
      <li>L'horari del <b>Foment</b> és de <b>DILLUNS A DIVENDRES de 9:00 a 13:00 i de 16:00 a 20:00</b>. <b>AGOST I FESTIUS TANCAT.</b></li>
      <li><b>La secció romandrà tancada els dies de tancament del FOMENT.</b></li>
    </ul>
  </div>

  <!-- Norma Obligatòria -->
  <div class="normes-card obligatori">
    <h3>🚨 OBLIGATORI</h3>
    <p class="obligatori-text">
      Netejar el billar i les boles abans de començar cada partida amb el material que la Secció posa a disposició de tots els socis.
    </p>
  </div>

  <!-- Prohibicions -->
  <div class="normes-card prohibit">

    <h3>🚫 PROHIBIT</h3>

    <ul>
      <li>Jugar a fantasia.</li>
      <li>Menjar mentre s'està jugant.</li>
      <li>Posar begudes sobre cap element del billar.</li>
    </ul>
  </div>

  <!-- Inscripció -->
  <div class="normes-card">
    <h3>📝 Inscripció a les partides</h3>
    <ul>
      <li>Apunta’t a la pissarra única de <b>PARTIDES SOCIALS</b>.</li>
      <li>Els companys no cal que s’apuntin; si ho fan, que sigui al costat del primer jugador.</li>
    </ul>
  </div>

  <!-- Assignació de taula -->
  <div class="normes-card">
    <h3>🗂 Assignació de taula</h3>
    <ul>
      <li>Quan hi hagi una taula lliure, ratlla el teu nom i juga.</li>
      <li>Si vols una taula concreta ocupada, <b>passa el torn</b> fins que s’alliberi.</li>
    </ul>
  </div>

  <!-- Temps de joc -->
  <div class="normes-card">
    <h3>⏳ Temps de joc</h3>
    <ul>
      <li>Màxim <b>1 hora</b> per partida (sol o en grup).</li>
      <li><b>PROHIBIT</b> posar monedes per allargar el temps, encara que hi hagi taules lliures.</li>
    </ul>
  </div>

  <!-- Tornar a jugar -->
  <div class="normes-card">
    <h3>🔄 Tornar a jugar</h3>
    <ul>
      <li>Només pots repetir si <b>no hi ha ningú apuntat</b> i hi ha una taula lliure.</li>
    </ul>
  </div>
</div>
  `;
}
