export function mostraEnllacos() {
  const cont = document.getElementById('content');
  cont.innerHTML = '';
  fetch('data/enllacos.json')
    .then(r => r.json())
    .then(d => {
      const tipusMap = {};
      d.forEach(item => {
        const tipus = item.Tipus || 'Altres';
        if (!tipusMap[tipus]) tipusMap[tipus] = [];
        tipusMap[tipus].push(item);
      });

      Object.entries(tipusMap).forEach(([tipus, items]) => {
        const tipusDetails = document.createElement('details');
        const tipusSummary = document.createElement('summary');
        tipusSummary.textContent = tipus;
        tipusSummary.classList.add('enllac-tipus');
        tipusDetails.appendChild(tipusSummary);

        items.forEach(ci => {
          const url = ci['Enllaç'] || ci.Enllac || ci.URL || ci.Url || ci.url;
          if (url) {
            const ul = tipusDetails.querySelector('ul') || document.createElement('ul');
            const li = document.createElement('li');
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
              url;
            if (ci.Billar) text += ` - Billar ${ci.Billar}`;
            a.textContent = text;
            li.appendChild(a);
            ul.appendChild(li);
            tipusDetails.appendChild(ul);
          }
        });

        cont.appendChild(tipusDetails);
      });
    })
    .catch(err => {
      cont.textContent = "No s'han pogut carregar els enllaços.";
      console.error('Error loading links', err);
    });
}
