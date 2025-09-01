export function mostraEnllacos() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  fetch('data/enllacos.json')
    .then(r => r.json())
    .then(d => {
      const tipusMap = {};
      d.forEach(item => {
        const tipus = item.Tipus || 'Altres';
        const club = item.Club || '';
        if (!tipusMap[tipus]) tipusMap[tipus] = {};
        if (!tipusMap[tipus][club]) tipusMap[tipus][club] = [];
        tipusMap[tipus][club].push(item);
      });

      Object.entries(tipusMap).forEach(([tipus, clubs]) => {
        const tipusDetails = document.createElement('details');
        const tipusSummary = document.createElement('summary');
        tipusSummary.textContent = tipus;
        tipusSummary.classList.add('enllac-tipus');
        tipusDetails.appendChild(tipusSummary);


        Object.entries(clubs).forEach(([club, items]) => {
          if (club) {
            const clubDiv = document.createElement('div');
            clubDiv.textContent = club;
            clubDiv.classList.add('enllac-club');
            tipusDetails.appendChild(clubDiv);
          }

          const ul = document.createElement('ul');
          ul.classList.add('enllacos-list');

          items.forEach(ci => {
            const url = ci['Enllaç'] || ci.Enllac || ci.URL || ci.Url || ci.url;
            if (!url) return;

            const li = document.createElement('li');
            li.classList.add('enllac-url');
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener';
            let text =
              ci.Club ||
              ci.Títol ||
              ci.Titol ||
              ci.Nom ||
              ci.Name ||
              ci.Text ||
              (ci.Billar ? `Billar ${ci.Billar}` : url);
            if (ci.Billar && (ci.Títol || ci.Titol || ci.Nom || ci.Name || ci.Text)) {
              text += ` - Billar ${ci.Billar}`;
            }
            a.textContent = text;
            li.appendChild(a);
            ul.appendChild(li);
          });

          tipusDetails.appendChild(ul);
        });

        cont.appendChild(tipusDetails);
      });
    })
    .catch(err => {
      cont.textContent = "No s'han pogut carregar els enllaços.";
      console.error('Error loading links', err);
    });
}
