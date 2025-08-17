import { appendResponsiveTable } from './state.js';

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


      const calculaInactivitat = dataStr => {
        if (!dataStr) return { dies: null, data: '' };
        const [d, m, y] = dataStr.split('/');
        const parsed = new Date(`${y}-${m}-${d}T00:00:00`);
        if (isNaN(parsed)) return { dies: null, data: '' };
        const dies = Math.floor(
          (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)
        );
        return { dies, data: `${d}/${m}/${y}` };
      };

      const disponible = (id, diesInactiu, posicio, repteActiu) => {
        if (parseInt(posicio, 10) === 1) return false;
        if (repteActiu) {
          if (!repteActiu.data_programa) {
            let limit = 0;
            let base = '';
            if (repteActiu.estat === 'proposat') {
              limit = 14;
              base = repteActiu.created_at;
            } else if (repteActiu.estat === 'acceptat') {
              limit = 7;
              base = repteActiu.data_acceptacio || repteActiu.created_at;
            }
            if (limit) {
              const diff = Math.floor(
                (Date.now() - new Date(base).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              if (diff < limit) return false;
            } else {
              return false;
            }
          } else {
            return false;
          }
        }
        if (diesInactiu == null) return true;
        return diesInactiu >= cooldownReptar;

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

      const filterLabel = document.createElement('label');
      filterLabel.id = 'ranking-filter-disponibles';
      const chkDisponibles = document.createElement('input');
      chkDisponibles.type = 'checkbox';
      filterLabel.appendChild(chkDisponibles);
      filterLabel.appendChild(
        document.createTextNode(' Mostra només disponibles')
      );

      const btnRanking = document.createElement('button');
      btnRanking.textContent = 'Rànquing actual';
      chkDisponibles.addEventListener('change', () => btnRanking.click());
      btnRanking.addEventListener('click', () =>
        showSection(btnRanking, () => {
          const title = document.createElement('h3');
          title.textContent = 'Rànquing actual';
          cont.appendChild(title);
          if (Array.isArray(ranking) && ranking.length) {
              const table = document.createElement('table');
              table.classList.add('ranking-table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            [
              'Posició',
              'Jugador',
              'Dies per reptar/ser reptat',
              'Disponible'
            ].forEach(h => {
              const th = document.createElement('th');
              th.textContent = h;
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            const ordered = ranking
              .slice()
              .sort((a, b) => parseInt(a.posicio) - parseInt(b.posicio));
            ordered.forEach(r => {
                const info = jugadors.find(j => j.id === r.jugador_id);
                const { dies: diesInactiu, data: dataUltim } = calculaInactivitat(
                  info ? info.data_ultim_repte : ''
                );
                const repteActiu = reptes.find(
                  rp =>
                    (rp.reptador_id === r.jugador_id || rp.reptat_id === r.jugador_id) &&
                    ['proposat', 'acceptat', 'programat'].includes(rp.estat)
                );
                const pot = disponible(
                  r.jugador_id,
                  diesInactiu,
                  r.posicio,
                  repteActiu
                );
                if (chkDisponibles.checked && !pot) return;

                const tr = document.createElement('tr');

                const posTd = document.createElement('td');
                posTd.textContent = r.posicio;

                posTd.classList.add('ranking-pos');

                tr.appendChild(posTd);

                const nom = mapJugadors[r.jugador_id] || r.jugador_id;
                const nameBtn = document.createElement('button');
                nameBtn.textContent = nom;
                nameBtn.addEventListener('click', () =>
                  mostraPartidesJugador(r.jugador_id, nom)
                );
                const nomTd = document.createElement('td');
                nomTd.classList.add('ranking-name');
                nomTd.appendChild(nameBtn);
                tr.appendChild(nomTd);

                const diesTd = document.createElement('td');
                let diesRestants = 0;
                if (repteActiu && !repteActiu.data_programa) {
                  let limit = 0;
                  let base = '';
                  if (repteActiu.estat === 'proposat') {
                    limit = 7;
                    base = repteActiu.created_at;
                  } else if (repteActiu.estat === 'acceptat') {
                    limit = 7;
                    base = repteActiu.data_acceptacio || repteActiu.created_at;
                  }
                  if (limit) {
                    const diff = Math.floor(
                      (Date.now() - new Date(base).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    diesRestants = Math.max(limit - diff, 0);
                  }
                } else if (diesInactiu != null) {

                  diesRestants = Math.max(cooldownReptar - diesInactiu, 0);
                  if (dataUltim) diesTd.title = `Últim repte: ${dataUltim}`;
                }
                diesTd.textContent = `${diesRestants} dies`;
                diesTd.dataset.label = 'Dies per reptar/ser reptat';
                tr.appendChild(diesTd);

                const potSpan = document.createElement('span');
                potSpan.textContent = pot ? '🟢' : '🔴';
                potSpan.title = pot
                  ? 'Pot reptar i ser reptat'
                  : 'No pot reptar ni ser reptat';
                const potTd = document.createElement('td');
                potTd.dataset.label = 'Disponible';
                potTd.appendChild(potSpan);
                tr.appendChild(potTd);

                tbody.appendChild(tr);
              });
            table.appendChild(tbody);
            const legenda = document.createElement('div');

            ['🟢 Pot reptar i ser reptat', '🔴 No pot reptar ni ser reptat'].forEach(
              t => {
                const p = document.createElement('p');
                p.textContent = t;
                legenda.appendChild(p);
              }
            );

            cont.appendChild(legenda);
            cont.appendChild(filterLabel);
            appendResponsiveTable(cont, table);
          } else {

            const p = document.createElement('p');
            p.textContent = 'No hi ha rànquing disponible.';
            cont.appendChild(p);
          }
        })
      );

      const renderReptes = (titleText, filterFn) => {
        const reptesFiltrats = reptes.filter(filterFn);
        const reptesPendents = reptesFiltrats.filter(r => r.estat === 'proposat');
        const reptesAcceptats = reptesFiltrats.filter(r => r.estat === 'acceptat');
        const reptesProgramats = reptesFiltrats.filter(r => r.estat === 'programat');
        const reptesTancats = reptesFiltrats.filter(r => r.estat === 'tancat');

        const title = document.createElement('h3');
        title.textContent = titleText;
        cont.appendChild(title);

        const drawCards = (list, infoFn, container = cont) => {
          list.forEach(r => {
            const card = document.createElement('div');
            card.classList.add('repte-card');
            const reptador = mapJugadors[r.reptador_id] || r.reptador_id;
            const reptat = mapJugadors[r.reptat_id] || r.reptat_id;
            const h4 = document.createElement('h4');
            h4.textContent = `${reptador} vs ${reptat}`;
            card.appendChild(h4);

            const info = infoFn(r);
            info.forEach(([label, value]) => {
              if (value) {
                const p = document.createElement('p');
                const d = new Date(value);
                p.textContent = `${label}: ${
                  !isNaN(d) ? d.toLocaleDateString('ca-ES') : value
                }`;
                card.appendChild(p);
              }
            });

            container.appendChild(card);
          });
        };

        const section = (t, list, infoFn, emptyMsg) => {
          const st = document.createElement('h4');
          st.textContent = t;
          cont.appendChild(st);
          if (list.length) {
            drawCards(list, infoFn);
          } else {
            const p = document.createElement('p');
            p.textContent = emptyMsg;
            cont.appendChild(p);
          }
        };

        const calcLimit = base =>
          base ? new Date(new Date(base).getTime() + 7 * 24 * 60 * 60 * 1000) : null;

        const infoPendents = r => {
          const limitAcceptar = calcLimit(r.created_at);
          const limitJugar = calcLimit(limitAcceptar);
          return [
            ['Creació', r.created_at],
            ['Límit acceptar', limitAcceptar],
            ['Límit jugar', limitJugar]
          ];
        };

        const infoAcceptats = r => [
          ['Creació', r.created_at],
          ['Acceptació', r.data_acceptacio],
          ['Límit jugar', calcLimit(r.data_acceptacio || r.created_at)]
        ];

        const infoProgramats = r => [
          ['Creació', r.created_at],
          ['Acceptació', r.data_acceptacio],
          ['Programació', r.data_programa],
          ['Límit jugar', calcLimit(r.data_acceptacio || r.created_at)]
        ];

        const mapPartides = Object.fromEntries(partides.map(p => [p.id, p]));

        const motiusMap = {
          REFUS: 'Refús',
          INCOMPAREIXENCA: 'Incompareixença',
          RESULTAT: 'Resultat'
        };

        const infoTancats = r => {
          const partida = mapPartides[r.partida_id] || {};
          const motiu =
            !partida.data && r.resultat_motiu
              ? motiusMap[r.resultat_motiu] || r.resultat_motiu
              : null;
          return [
            ['Creació', r.created_at],
            ['Acceptació', r.data_acceptacio],
            ['Programació', r.data_programa],
            ['Jugat', partida.data],
            ['Motiu tancament', motiu]
          ];
        };

        section(
          'Pendents d’acceptar',
          reptesPendents,
          infoPendents,
          'No hi ha reptes pendents.'
        );
        section(
          'Acceptats',
          reptesAcceptats,
          infoAcceptats,
          'No hi ha reptes acceptats.'
        );
        section(
          'Programats',
          reptesProgramats,
          infoProgramats,
          'No hi ha reptes programats.'
        );

        const detTancats = document.createElement('details');
        detTancats.id = 'reptes-tancats';
        const sumTancats = document.createElement('summary');
        sumTancats.textContent = 'Tancats';
        detTancats.appendChild(sumTancats);
        if (reptesTancats.length) {
          drawCards(reptesTancats, infoTancats, detTancats);
        } else {
          const p = document.createElement('p');
          p.textContent = 'No hi ha reptes tancats.';
          detTancats.appendChild(p);
        }
        cont.appendChild(detTancats);
      };

      const btnReptes = document.createElement('button');
      btnReptes.textContent = 'Reptes';
      btnReptes.addEventListener('click', () =>
        showSection(btnReptes, () =>
          renderReptes('Reptes', r => r.tipus !== 'acces')
        )
      );

      const btnLlista = document.createElement('button');
      btnLlista.textContent = "Llista d'espera";
      btnLlista.addEventListener('click', () =>
        showSection(btnLlista, () => {
          const title = document.createElement('h3');
          title.textContent = "Llista d'espera";
          cont.appendChild(title);
          if (Array.isArray(llista) && llista.length) {
            const table = document.createElement('table');
            // Usa el mateix estil del rànquing actiu però sense els colors de medalla
            table.classList.add('ranking-table', 'no-medals');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Posició', 'Jugador', 'Pot reptar'].forEach(h => {
              const th = document.createElement('th');
              th.textContent = h;
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            const ordered = llista
              .slice()
              .sort((a, b) => parseInt(a.ordre, 10) - parseInt(b.ordre, 10));
            ordered.forEach((l, idx) => {
              const tr = document.createElement('tr');

              const posTd = document.createElement('td');
              posTd.textContent = l.ordre;
              posTd.classList.add('ranking-pos');
              tr.appendChild(posTd);

              const nom = mapJugadors[l.jugador_id] || l.jugador_id;
              const nameBtn = document.createElement('button');
              nameBtn.textContent = nom;
              nameBtn.addEventListener('click', () =>
                mostraEvolucioJugador(l.jugador_id, nom)
              );
              const nomTd = document.createElement('td');
              nomTd.classList.add('ranking-name');
              nomTd.appendChild(nameBtn);
              tr.appendChild(nomTd);

              const potTd = document.createElement('td');
              const potSpan = document.createElement('span');
              const pot = idx === 0;
              potSpan.textContent = pot ? '🟢' : '🔴';
              potSpan.title = pot
                ? 'Pot reptar el jugador 20'
                : 'No pot reptar';
              potTd.dataset.label = 'Pot reptar';
              potTd.appendChild(potSpan);
              tr.appendChild(potTd);

              tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            const legenda = document.createElement('div');
            ['🟢 Pot reptar', '🔴 No pot reptar'].forEach(t => {
              const p = document.createElement('p');
              p.textContent = t;
              legenda.appendChild(p);
            });
            cont.appendChild(legenda);
            appendResponsiveTable(cont, table);
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
        showSection(btnAcces, () =>
          renderReptes('Reptes accés', r => r.tipus === 'acces')
        )
      );

      const btnPartides = document.createElement('button');
      btnPartides.textContent = 'Partides';
      btnPartides.addEventListener('click', () =>
        showSection(btnPartides, () => {
          const title = document.createElement('h3');
          title.textContent = 'Partides';
          cont.appendChild(title);
          if (Array.isArray(partides) && partides.length) {
            const rankingMap = Object.fromEntries(
              ranking.map(r => [r.jugador_id, parseInt(r.posicio, 10)])
            );
            const sorted = partides
              .slice()
              .sort((a, b) => new Date(b.data) - new Date(a.data));
            sorted.forEach(p => {
              const card = document.createElement('div');
              card.classList.add('partida-card');
              const repte = reptes.find(r => r.id === p.repte_id) || {};
              const local = mapJugadors[p.local_id] || p.local_id;
              const visitant = mapJugadors[p.visitant_id] || p.visitant_id;
              let resultat = '';
              if (p.caramboles_local && p.caramboles_visitant) {
                resultat = `${p.caramboles_local}-${p.caramboles_visitant}`;
              } else if (
                repte.resultat_motiu &&
                repte.resultat_motiu !== 'RESULTAT'
              ) {
                resultat = repte.resultat_motiu
                  .toLowerCase()
                  .replace(/_/g, ' ');
                resultat = resultat.charAt(0).toUpperCase() + resultat.slice(1);
              }
              const posLocalAfter = rankingMap[p.local_id];
              const posVisitantAfter = rankingMap[p.visitant_id];
              const swap = repte.resultat_guanya_reptador === 'TRUE';
              let posLocalInicial = posLocalAfter;
              let posVisitantInicial = posVisitantAfter;
              if (swap && posLocalAfter !== undefined && posVisitantAfter !== undefined) {
                posLocalInicial = posVisitantAfter;
                posVisitantInicial = posLocalAfter;
              }
              const posLocalText =
                posLocalInicial !== undefined ? posLocalInicial : '-';
              const posVisitantText =
                posVisitantInicial !== undefined ? posVisitantInicial : '-';
              const swapText = swap
                ? 'Intercanvi de posicions'
                : 'No intercanvi de posicions';
              const date = p.data
                ? new Date(p.data).toLocaleDateString('ca-ES')
                : '';
              card.innerHTML = `
                <h4>${date}</h4>
                <p>${local} (Pos. ${posLocalText}) vs ${visitant} (Pos. ${posVisitantText})</p>
                <p>Resultat: ${resultat}</p>
                <p>${swapText}</p>
              `;
              cont.appendChild(card);
            });
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

      [btnRanking, btnReptes, btnLlista, btnAcces, btnPartides, btnNormativa].forEach(b =>
        btnContainer.appendChild(b)
      );

      btnRanking.click();
    })
    .catch(err => {
      console.error('Error carregant dades continu 3B', err);
      cont.innerHTML = '<p>Error carregant dades.</p>';
    });
}
