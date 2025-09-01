// API base URL can be overridden via a global variable or environment variable
const API_BASE =
  window.API_BASE ||
  (typeof process !== 'undefined' && process.env.API_BASE) ||
  "http://localhost:8000/api";
const token = 'secret';
async function fetchData() {
    const resR = await fetch(`${API_BASE}/ranking`);
    const ranking = await resR.json();
    const resW = await fetch(`${API_BASE}/waitlist`);
    const wait = await resW.json();
    const resC = await fetch(`${API_BASE}/challenges`);
    const chall = await resC.json();
    const rList = document.getElementById('ranking');
    ranking.forEach(e=>{
        const li=document.createElement('li');
        li.textContent = `${e.position}. ${e.player.name} (${e.player.id})`;
        rList.appendChild(li);
    });
    const wList = document.getElementById('waitlist');
    wait.forEach(e=>{
        const li=document.createElement('li');
        li.textContent = `${e.order}. ${e.player.name} (${e.player.id})`;
        wList.appendChild(li);
    });
    const cList = document.getElementById('challenges');
    chall.forEach(c=>{
        const li=document.createElement('li');
        li.textContent = `${c.challenger_id} vs ${c.challenged_id} - ${c.state}`;
        cList.appendChild(li);
    });
}

document.getElementById('enter').addEventListener('click',()=>{
    const code = document.getElementById('code').value;
    if(code===token){
        document.getElementById('login').style.display='none';
        document.getElementById('app').style.display='block';
        fetchData();
    } else {
        alert('Codi incorrecte');
    }
});

if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js');
}
