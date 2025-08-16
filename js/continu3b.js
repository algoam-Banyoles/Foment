import { appendResponsiveTable } from "./init.js";

export function mostraContinu3B() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';

  const btnContainer = document.getElementById('continu3b-buttons');
  btnContainer.innerHTML = '';


  Promise.all([
    fetch('data/continu3b_rankingactiu.json').then(r => r.json()).catch(() => []),
    fetch('data/continu3b_llistaespera.json').then(r => r.json()).catch(() => []),
    fetch('data/continu3b_reptes.json').then(r => r.json()).catch(() => []),
    fetch('data/continu3b_partides.json').then(r => r.json()).catch(() => []),
    fetch('data/continu3b_jugadors.json').then(r => r.json()).catch(() => []),
    fetch('data/continu3b_parametres.json').then(r => r.json()).catch(() => [])
  ])
    .then(([ranking, llista, reptes, partides, jugadors, parametres]) => {

      const mapJugadors = Object.fromEntries(jugadors.map(j => [j.id, j.nom]));

      const cooldownReptar =
        parseInt(
          (parametres.find(p => p.clau === 'COOLDOWN_REPTAR_DIES') || {})
            .valor,
          10
        ) || 7;


      const disponible = (id, dataStr, posicio) => {
        if (parseInt(posicio, 10) === 1) return false;
        const actiu = reptes.some(
          r =>
            (r.reptador_id === id || r.reptat_id === id) &&
            ['proposat', 'acceptat', 'programat'].includes(r.estat)

        );
        if (actiu) return false;
        if (!dataStr) return true;
        const [d, m, y] = dataStr.split('/');
        const parsed = new Date(`${y}-${m}-${d}T00:00:00`);
        if (isNaN(parsed)) return true;
        const diff = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= cooldownReptar;

      };

      function mostraPartidesJugador(id, nom) {
        cont.innerHTML = '';
        const title = document.createElement('h3');
        title.textContent = `Partides de ${nom}`;
        cont.appendChild(title);
        const partJug = partides.filter(
          p => p.local_id === id || p.visitant_id === id
        );
        if (partJug.length) {
          const table = document.createElement('table');
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['Data', 'Rival', 'Resultat'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          partJug.forEach(p => {
            const tr = document.createElement('tr');
            const data = p.data
              ? new Date(p.data).toLocaleDateString('ca-ES')
              : '';
            const esLocal = p.local_id === id;
            const rivalId = esLocal ? p.visitant_id : p.local_id;
            const rival = mapJugadors[rivalId] || rivalId;
            const resultat =
              p.caramboles_local && p.caramboles_visitant
                ? esLocal
                  ? `${p.caramboles_local}-${p.caramboles_visitant}`
                  : `${p.caramboles_visitant}-${p.caramboles_local}`
                : '';
            [data, rival, resultat].forEach(t => {
              const td = document.createElement('td');
              td.textContent = t;
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          appendResponsiveTable(cont, table);
        } else {
          const p = document.createElement('p');
          p.textContent = 'No hi ha partides per aquest jugador.';
          cont.appendChild(p);
        }
        const backBtn = document.createElement('button');
        backBtn.textContent = 'Torna';
        backBtn.addEventListener('click', () => btnRanking.click());
        cont.appendChild(backBtn);
      }

      const showSection = (btn, render) => {
        btnContainer.querySelectorAll('button').forEach(b =>
          b.classList.remove('selected')
        );
        btn.classList.add('selected');
        cont.innerHTML = '';
        render();
      };

      const btnRanking = document.createElement('button');
      btnRanking.textContent = 'Rànquing actual';
      btnRanking.addEventListener('click', () =>
        showSection(btnRanking, () => {
          const title = document.createElement('h3');
          title.textContent = 'Rànquing actual';
          cont.appendChild(title);
          if (Array.isArray(ranking) && ranking.length) {
            const legenda = document.createElement('div');

              ['🟢 Pot reptar i ser reptat', '🔴 No pot reptar ni ser reptat'].forEach(
                t => {
                  const p = document.createElement('p');
                  p.textContent = t;
                  legenda.appendChild(p);
                }
              );

            cont.appendChild(legenda);
            const table = document.createElement('table');
            table.classList.add('ranking-table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            ['Posició', 'Jugador', 'Disponible'].forEach(h => {

              const th = document.createElement('th');
              th.textContent = h;
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            ranking
              .slice()
              .sort((a, b) => parseInt(a.posicio, 10) - parseInt(b.posicio, 10))
              .forEach((r, idx) => {
                const tr = document.createElement('tr');
                if (idx < 3) tr.classList.add(`top${idx + 1}`);
                const posTd = document.createElement('td');
                posTd.textContent = r.posicio;
                tr.appendChild(posTd);
                const nom = mapJugadors[r.jugador_id] || r.jugador_id;
                const nameTd = document.createElement('td');
                const nameBtn = document.createElement('button');
                nameBtn.textContent = nom;
                nameBtn.addEventListener('click', () =>
                  mostraPartidesJugador(r.jugador_id, nom)
                );
                nameTd.appendChild(nameBtn);
                tr.appendChild(nameTd);
                const info = jugadors.find(j => j.id === r.jugador_id);

                const pot = disponible(
                  r.jugador_id,
                  info ? info.data_ultim_repte : '',
                  r.posicio
                );
                const potTd = document.createElement('td');
                const potSpan = document.createElement('span');
                potSpan.textContent = pot ? '🟢' : '🔴';
                potSpan.title = pot
                  ? 'Pot reptar i ser reptat'
                  : 'No pot reptar ni ser reptat';
                potTd.appendChild(potSpan);
                tr.appendChild(potTd);
                tbody.appendChild(tr);
              });
              table.appendChild(tbody);
              appendResponsiveTable(cont, table);
            } else {

            const p = document.createElement('p');
            p.textContent = 'No hi ha rànquing disponible.';
            cont.appendChild(p);
          }
        })
      );

      const btnReptes = document.createElement('button');
      btnReptes.textContent = 'Reptes';
      btnReptes.addEventListener('click', () =>
        showSection(btnReptes, () => {
          const reptesAcceptats = reptes.filter(
            r => r.estat === 'acceptat' && r.tipus !== 'acces'
          );
          const reptesProposats = reptes.filter(
            r => r.estat === 'proposat' && r.tipus !== 'acces'
          );

          const title = document.createElement('h3');
          title.textContent = 'Reptes';
          cont.appendChild(title);

          const drawTable = list => {
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Reptador', 'Reptat', 'Creació', 'Acceptació', 'Programació', 'Límit'].forEach(
              h => {
                const th = document.createElement('th');
                th.textContent = h;
                headerRow.appendChild(th);
              }
            );
            thead.appendChild(headerRow);
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            list.forEach(r => {
              const tr = document.createElement('tr');
              const reptador = mapJugadors[r.reptador_id] || r.reptador_id;
              const reptat = mapJugadors[r.reptat_id] || r.reptat_id;
              const created = r.created_at
                ? new Date(r.created_at).toLocaleDateString('ca-ES')
                : '';
              const accept = r.data_acceptacio
                ? new Date(r.data_acceptacio).toLocaleDateString('ca-ES')
                : '';
              const program = r.data_programa
                ? new Date(r.data_programa).toLocaleDateString('ca-ES')
                : '';
              const deadline = r.deadline_jugar
                ? new Date(r.deadline_jugar).toLocaleDateString('ca-ES')
                : '';
              [reptador, reptat, created, accept, program, deadline].forEach(t => {
                const td = document.createElement('td');
                td.textContent = t;
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            appendResponsiveTable(cont, table);
          };

          const accTitle = document.createElement('h4');
          accTitle.textContent = 'Reptes acceptats';
          cont.appendChild(accTitle);
          if (reptesAcceptats.length) {
            drawTable(reptesAcceptats);
          } else {
            const p = document.createElement('p');
            p.textContent = 'No hi ha reptes acceptats.';
            cont.appendChild(p);
          }

          const propTitle = document.createElement('h4');
          propTitle.textContent = 'Reptes proposats';
          cont.appendChild(propTitle);
          if (reptesProposats.length) {
            drawTable(reptesProposats);
          } else {
            const p = document.createElement('p');
            p.textContent = 'No hi ha reptes proposats.';
            cont.appendChild(p);
          }
        })
      );

      const btnLlista = document.createElement('button');
      btnLlista.textContent = "Llista d'espera";
      btnLlista.addEventListener('click', () =>
        showSection(btnLlista, () => {
          const title = document.createElement('h3');
          title.textContent = "Llista d'espera";
          cont.appendChild(title);
          if (Array.isArray(llista) && llista.length) {
            const div = document.createElement('div');
            llista
              .slice()
              .sort((a, b) => parseInt(a.ordre, 10) - parseInt(b.ordre, 10))
              .forEach(l => {
                const btn = document.createElement('button');
                const nom = mapJugadors[l.jugador_id] || l.jugador_id;
                btn.textContent = `${l.ordre}. ${nom}`;
                btn.addEventListener('click', () =>
                  mostraEvolucioJugador(l.jugador_id, nom)
                );
                div.appendChild(btn);
              });
            cont.appendChild(div);
          } else {
            const p = document.createElement('p');
            p.textContent = "No hi ha jugadors en llista d'espera.";
            cont.appendChild(p);
          }
        })
      );

      const btnAcces = document.createElement('button');
      btnAcces.textContent = 'Reptes accés';
      btnAcces.addEventListener('click', () =>
        showSection(btnAcces, () => {
          const title = document.createElement('h3');
          title.textContent = 'Reptes accés';
          cont.appendChild(title);

          const reptesAcces = reptes.filter(
            r => r.estat !== 'tancat' && r.tipus === 'acces'
          );
          const subRepTitle = document.createElement('h4');
          subRepTitle.textContent = 'Reptes';
          cont.appendChild(subRepTitle);
          if (reptesAcces.length) {
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Reptador', 'Reptat', 'Creació', 'Acceptació', 'Programació', 'Límit'].forEach(
              h => {
                const th = document.createElement('th');
                th.textContent = h;
                headerRow.appendChild(th);
              }
            );
            thead.appendChild(headerRow);
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            reptesAcces.forEach(r => {
              const tr = document.createElement('tr');
              const reptador = mapJugadors[r.reptador_id] || r.reptador_id;
              const reptat = mapJugadors[r.reptat_id] || r.reptat_id;
              const created = r.created_at
                ? new Date(r.created_at).toLocaleDateString('ca-ES')
                : '';
              const accept = r.data_acceptacio
                ? new Date(r.data_acceptacio).toLocaleDateString('ca-ES')
                : '';
              const program = r.data_programa
                ? new Date(r.data_programa).toLocaleDateString('ca-ES')
                : '';
              const deadline = r.deadline_jugar
                ? new Date(r.deadline_jugar).toLocaleDateString('ca-ES')
                : '';
              [reptador, reptat, created, accept, program, deadline].forEach(t => {
                const td = document.createElement('td');
                td.textContent = t;
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            appendResponsiveTable(cont, table);
          } else {
            const p = document.createElement('p');
            p.textContent = 'No hi ha reptes d\'accés pendents.';
            cont.appendChild(p);
          }

          const partTitle = document.createElement('h4');
          partTitle.textContent = 'Partides';
          cont.appendChild(partTitle);
          const partidesAcces = partides.filter(p => {
            const repte = reptes.find(r => r.id === p.repte_id);
            return repte && repte.tipus === 'acces';
          });
          partidesAcces.sort((a, b) => new Date(b.data) - new Date(a.data));
          if (partidesAcces.length) {
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Data', 'Local', 'Visitant', 'Guanyador', 'Swap'].forEach(h => {
              const th = document.createElement('th');
              th.textContent = h;
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            partidesAcces.forEach(p => {
              const repte = reptes.find(r => r.id === p.repte_id) || {};
              const reptador = mapJugadors[repte.reptador_id] || repte.reptador_id;
              const reptat = mapJugadors[repte.reptat_id] || repte.reptat_id;
              let guanyador = '';
              if (repte.resultat_guanya_reptador === 'TRUE') {
                guanyador = reptador;
              } else if (repte.resultat_guanya_reptador === 'FALSE') {
                guanyador = reptat;
              }
              let swapText = 'No intercanvi posicions';
              if (repte.tipus === 'acces' && repte.resultat_guanya_reptador === 'TRUE') {
                swapText = 'Intercanvi posicions';
              }
              const date = p.data
                ? new Date(p.data).toLocaleDateString('ca-ES')
                : '';
              const tr = document.createElement('tr');
              [date, reptador, reptat, guanyador, swapText].forEach(t => {
                const td = document.createElement('td');
                td.textContent = t;
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            appendResponsiveTable(cont, table);
          } else {
            const p = document.createElement('p');
            p.textContent = 'No hi ha partides registrades.';
            cont.appendChild(p);
          }
        })
      );

      const btnNormativa = document.createElement('button');
      btnNormativa.textContent = 'Normativa';
      btnNormativa.addEventListener('click', () =>
        showSection(btnNormativa, () => {

          cont.innerHTML = `
<div class="normes-container">
  <h2 class="normes-title">Normativa Continu 3B</h2>

  <div class="normes-card">
    <h3>📊 Rànquing actiu</h3>
    <ul>
      <li><strong>Màxim 20 jugadors</strong>, actualitzat contínuament mitjançant reptes directes</li>
      <li>Els jugadors que vulguin formar part del rànquing un cop s'arribi al màxim de 20 jugadors formaran part de la <strong>llista d'espera</strong>.</li>
    </ul>
  </div>

  <div class="normes-card">
    <h3>⚔️ Reptes normals</h3>
    <ul>
      <li>Pots reptar fins a <strong>2 posicions</strong> per sobre teu.</li>
      <li><strong>Màxim un repte actiu</strong> per jugador.</li>
      <li><strong>Mínim 7 dies</strong> entre reptes.</li>
      <li>Si guanya el reptador → <strong>intercanvi de posicions</strong>.</li>
      <li>Si perd el reptador → <strong>no hi ha canvis</strong>.</li>
    </ul>
  </div>

  <div class="normes-card">
    <h3>🚪 Reptes d’accés</h3>
    <ul>
      <li><strong>Primer de la llista d’espera</strong> pot reptar el jugador 20.</li>
      <li>Si guanya → <strong>entra al rànquing</strong> (pos. 20) i el perdedor passa a la llista d’espera.</li>
      <li>Si perd → passa al final de la <strong>llista d’espera</strong>.</li>
    </ul>
  </div>

  <div class="normes-card">
    <h3>⏱️ Terminis</h3>
    <p><strong>7 dies</strong> per acceptar un repte i <strong>7 dies</strong> per jugar-lo un cop acceptat.</p>
  </div>

  <div class="normes-card">
    <h3>⚠️ Penalitzacions</h3>
    <ul>
      <li>Incompareixença o refús sense motiu → <strong>derrota automàtica</strong>.</li>
      <li>Sense acord de data → tots dos <strong>perden una posició</strong>.</li>
    </ul>
  </div>

  <div class="normes-card">
    <h3>😴 Inactivitat</h3>
    <ul>
      <li><strong>3 setmanes</strong> sense reptes → baixa 5 posicions (pre-inactiu).</li>
      <li><strong>6 setmanes</strong> sense reptes → surt del rànquing i entra el primer de la llista d’espera.</li>
    </ul>
  </div>

  <div class="normes-card">
    <p>Consulta la <a href="https://docs.google.com/document/d/165_bh9m0WxRU_LoTt_k8aiJseZZn9bBZ/edit?usp=sharing&amp;ouid=102336298592739127647&amp;rtpof=true&amp;sd=true" target="_blank" rel="noopener"><strong>normativa completa</strong></a>.</p>
  </div>
</div>`;
        })
      );

      [btnRanking, btnReptes, btnLlista, btnAcces, btnNormativa].forEach(b =>
        btnContainer.appendChild(b)
      );

      btnRanking.click();
    })
    .catch(err => {
      console.error('Error carregant dades continu 3B', err);
      cont.innerHTML = '<p>Error carregant dades.</p>';
    });
}
