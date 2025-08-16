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
    fetch('data/continu3b_jugadors.json').then(r => r.json()).catch(() => [])
  ])
    .then(([ranking, llista, reptes, partides, jugadors]) => {

      const mapJugadors = Object.fromEntries(jugadors.map(j => [j.id, j.nom]));

      const esReptable = dataStr => {
        if (!dataStr) return true;
        const [d, m, y] = dataStr.split('/');
        const parsed = new Date(`${y}-${m}-${d}T00:00:00`);
        if (isNaN(parsed)) return true;
        const diff = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 7;
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
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Posició', 'Jugador', ''].forEach(h => {
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
              .forEach(r => {
                const tr = document.createElement('tr');
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
                const reptTd = document.createElement('td');
                const info = jugadors.find(j => j.id === r.jugador_id);
                const reptable = esReptable(info ? info.data_ultim_repte : '');
                const span = document.createElement('span');
                span.textContent = reptable ? '🟢' : '🔴';
                span.title = reptable ? 'Reptable' : 'No reptable';
                reptTd.appendChild(span);
                tr.appendChild(reptTd);
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
          const reptesPendents = reptes.filter(
            r => r.estat !== 'tancat' && r.tipus !== 'acces'
          );
          const title = document.createElement('h3');
          title.textContent = 'Reptes';
          cont.appendChild(title);
          if (reptesPendents.length) {
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
            reptesPendents.forEach(r => {
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
            p.textContent = 'No hi ha reptes pendents.';
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
    <h3>Rànquing actiu</h3>
    <p>Màxim 20 jugadors, actualitzat contínuament mitjançant reptes directes.</p>
  </div>

  <div class="normes-card">
    <h3>Reptes normals</h3>
    <ul>
      <li>Pots reptar fins a 2 posicions per sobre teu.</li>
      <li>Màxim un repte actiu per jugador.</li>
      <li>Mínim 7 dies entre reptes.</li>
      <li>Si guanya el reptador → intercanvi de posicions.</li>
      <li>Si perd → no hi ha canvis.</li>
    </ul>
  </div>

  <div class="normes-card">
    <h3>Reptes d’accés</h3>
    <ul>
      <li>Primer de la llista d’espera pot reptar el jugador 20.</li>
      <li>Si guanya → entra al rànquing (pos. 20) i el perdedor passa a la llista d’espera.</li>
      <li>Si perd → passa al final de la llista d’espera.</li>
    </ul>
  </div>

  <div class="normes-card">
    <h3>Terminis</h3>
    <p>7 dies per acceptar un repte i 7 dies per jugar-lo un cop acceptat.</p>
  </div>

  <div class="normes-card">
    <h3>Penalitzacions</h3>
    <ul>
      <li>Incompareixença o refús sense motiu → derrota automàtica.</li>
      <li>Sense acord de data → tots dos perden una posició.</li>
    </ul>
  </div>

  <div class="normes-card">
    <h3>Inactivitat</h3>
    <ul>
      <li>3 setmanes sense reptes → baixa 5 posicions (pre-inactiu).</li>
      <li>6 setmanes sense reptes → surt del rànquing i entra el primer de la llista d’espera.</li>
    </ul>
  </div>

  <div class="normes-card">
    <p>Consulta la <a href="https://docs.google.com/document/d/165_bh9m0WxRU_LoTt_k8aiJseZZn9bBZ/edit?usp=sharing&amp;ouid=102336298592739127647&amp;rtpof=true&amp;sd=true" target="_blank" rel="noopener">normativa completa</a>.</p>
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
