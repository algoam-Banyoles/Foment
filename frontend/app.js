const token = 'secret';
async function fetchData() {
    const resR = await fetch('/api/ranking');
    const ranking = await resR.json();
    const resW = await fetch('/api/waitlist');
    const wait = await resW.json();
    const resC = await fetch('/api/challenges');
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
