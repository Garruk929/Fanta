/* Fanta Live 2.5.0 — import Leghe semplice da iPhone: copia link, incolla, importa */
(function(){
  'use strict';
  const $=id=>document.getElementById(id),REPAIR_KEY='fantaRepairV1',APP='https://garruk929.github.io/Fanta/?v=2.5.0#repair';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const slugify=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const read=()=>{try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{teams:[],freeAgents:[],transactions:[]}}catch(e){return{teams:[],freeAgents:[],transactions:[]}}};
  const write=s=>localStorage.setItem(REPAIR_KEY,JSON.stringify(s));

  function refFrom(raw){
    let t=String(raw||'').trim();if(!t)throw Error('Copia un link della tua lega oppure scrivi il suo alias.');
    const hit=t.match(/https?:\/\/(?:www\.)?leghe\.fantacalcio\.it\/[^\s]+/i)||t.match(/(?:www\.)?leghe\.fantacalcio\.it\/[^\s]+/i);
    if(hit){let u=hit[0];if(!/^https?:\/\//i.test(u))u='https://'+u;u=new URL(u);const p=u.pathname.split('/').filter(Boolean);if(!p.length)throw Error('Nel link non trovo la lega.');return{slug:p[0],base:`https://leghe.fantacalcio.it/${p[0]}`}}
    if(/^https?:\/\//i.test(t))throw Error('Serve un link di leghe.fantacalcio.it.');
    const slug=slugify(t.split(/[/?#]/)[0]);if(!slug)throw Error('Alias lega non valido.');return{slug,base:`https://leghe.fantacalcio.it/${slug}`};
  }
  async function jina(url){const clean=url.replace(/^https?:\/\//,'');const r=await fetch('https://r.jina.ai/http://'+clean,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.text()}

  function parseTeams(text){
    const L=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),out=[],seen=new Set();
    const add=(name,c)=>{name=String(name||'').replace(/^#{1,6}\s*/,'').trim();const k=norm(name);if(!k||seen.has(k)||/^(squadre|divisione\b|strumenti|per l'admin)/i.test(name))return;seen.add(k);out.push({name,credits:Math.max(0,Math.round(+c||0))})};
    for(let i=0;i<L.length;i++){
      const m=L[i].match(/^(\d+)\s+Budget disponibile/i);if(!m)continue;let name='';
      for(let j=i-1;j>=0&&j>=i-8;j--){const h=L[j].match(/^#{3,6}\s+(.+)/);if(h&&!/^(Squadre|Il gioco|PER L'ADMIN|STRUMENTI)/i.test(h[1])){name=h[1];break}}
      if(!name)for(let j=i-1;j>=0&&j>=i-5;j--){const d=L[j].match(/^Divisione\s+[A-Z0-9]+\s+(.+)/i);if(d){name=d[1];break}}
      if(!name)for(let j=i-1;j>=0&&j>=i-4;j--){if(!/Budget disponibile|Divisione|^Image$|^Previous|^Next/i.test(L[j])&&L[j].length<80){name=L[j];break}}
      add(name,m[1]);
    }return out;
  }
  function visiblePlayers(text){const P=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[],hay=' '+norm(text)+' ';return P.filter(p=>{const a=norm(p.name),b=norm(p.alias);return(a.length>=4&&hay.includes(' '+a+' '))||(b.length>=5&&hay.includes(' '+b+' '))})}
  function saveTeams(teams,slug){const s=read(),mine=s.teams?.find(t=>t.mine)?.name||'';s.teams=teams.map((t,i)=>({id:'pub'+(i+1),name:t.name,credits:t.credits,mine:mine?norm(t.name)===norm(mine):i===0}));if(!s.teams.some(t=>t.mine)&&s.teams[0])s.teams[0].mine=true;s.leagueSize=s.teams.length;s.leagueName=slug;s.sourceName='Leghe · '+slug+' · link';s.version=8;write(s);localStorage.setItem('fantaModeV2','repair')}
  function saveFree(players,slug){if(players.length<10)return;const s=read(),m=new Map();players.forEach(p=>p?.name&&p?.role&&m.set(norm(p.name)+'|'+p.role,{...p}));s.freeAgents=[...m.values()];s.sourceName='Leghe · '+slug+' · link';s.transactions=[];s.version=8;write(s)}

  async function importLeague(raw){
    const st=$('easyImportStatus'),r=refFrom(raw);st.textContent='Cerco squadre e crediti…';let teams=[],used='';
    for(const p of ['/squadre?all=true','/squadre','/area-gioco/squadre?all=true','/area-gioco/squadre']){try{const t=await jina(r.base+p),x=parseTeams(t);if(x.length>=2){teams=x;used=p;break}}catch(e){}}
    if(teams.length<2)throw Error('Non riesco a leggere questa lega dal link. Prova a copiare l’indirizzo da un’altra pagina della stessa lega oppure inserisci direttamente l’alias della lega.');
    saveTeams(teams,r.slug);st.textContent=`✓ ${teams.length} squadre e crediti. Cerco gli svincolati…`;
    let free=[];for(const p of ['/market/players?releaseds=','/area-gioco/market/players?releaseds=']){try{const x=visiblePlayers(await jina(r.base+p));if(x.length>free.length)free=x;if(x.length>=20)break}catch(e){}}
    saveFree(free,r.slug);sessionStorage.setItem('fantaEasyImport',JSON.stringify({teams:teams.length,free:free.length,slug:r.slug,path:used}));st.textContent=`✓ Fatto: ${teams.length} squadre${free.length>=10?` · ${free.length} svincolati`:''}.`;
    setTimeout(()=>location.replace(APP),500);
  }
  async function pasteImport(){let t='';try{t=await navigator.clipboard.readText()}catch(e){}if(!t){$('easyLeagueLink')?.focus();throw Error('Safari non mi ha dato accesso agli appunti: incolla il link nel campo e premi Importa.')}$('easyLeagueLink').value=t;return importLeague(t)}

  function modal(){
    let o=$('easyLegheModal');if(o)return o;o=document.createElement('div');o.className='overlay';o.id='easyLegheModal';
    o.innerHTML=`<div class="repair-sheet easy-leghe-sheet"><div class="grab"></div><div class="leghe-import-head"><div><span class="repair-kicker">IMPORTA LEGA</span><h3>3 tocchi e hai finito</h3></div><span class="leghe-lock">📱 iPhone</span></div>
    <p class="repair-help">Non cercare <b>/squadre</b> e non creare preferiti strani. In Safari apri <b>qualsiasi pagina della tua lega</b>, copia l’indirizzo, torna qui e premi il pulsante.</p>
    <div class="easy-three"><span><b>1</b> Leghe → Copia indirizzo</span><span><b>2</b> Torna a Fanta Live</span><span><b>3</b> Incolla e importa</span></div>
    <button class="repair-confirm easy-big" id="easyPasteImport">📋 Incolla e importa</button>
    <label class="repair-field">Link o alias della lega<input id="easyLeagueLink" type="text" inputmode="url" autocomplete="off" placeholder="Qualsiasi link della lega, oppure es. mia-lega"></label>
    <button class="wide" id="easyManualImport">Importa questo</button><button class="wide" id="easyOpenLeghe">Apri Leghe Fantacalcio ↗</button>
    <div class="leghe-status" id="easyImportStatus">Suggerimento: puoi usare anche un link tipo /area-gioco, /mercato, /formazione ecc. Fanta Live ricava da solo la lega.</div>
    <details class="private-fallback"><summary>Alternativa</summary><button class="wide" id="easyFileImport">📄 Importa file / JSON</button></details><button class="repair-close" id="easyClose">Chiudi</button></div>`;
    document.body.appendChild(o);$('easyClose').onclick=()=>o.classList.remove('show');o.onclick=e=>{if(e.target===o)o.classList.remove('show')};
    $('easyPasteImport').onclick=()=>pasteImport().catch(e=>$('easyImportStatus').textContent='Errore: '+e.message);$('easyManualImport').onclick=()=>importLeague($('easyLeagueLink').value).catch(e=>$('easyImportStatus').textContent='Errore: '+e.message);$('easyLeagueLink').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('easyManualImport').click()}};$('easyOpenLeghe').onclick=()=>window.open('https://leghe.fantacalcio.it/','_blank','noopener');$('easyFileImport').onclick=()=>{o.classList.remove('show');$('repairCreditsFile')?.click()};return o;
  }
  function bind(){const b=$('importCreditsBtn');if(!b)return;b.id='importLeagueBtn';b.textContent='📲 Importa Lega';b.title='Copia un link qualsiasi della lega e importa';b.onclick=()=>modal().classList.add('show')}
  function resultToast(){let x;try{x=JSON.parse(sessionStorage.getItem('fantaEasyImport')||'null')}catch(e){}if(!x)return;sessionStorage.removeItem('fantaEasyImport');setTimeout(()=>{let t=document.createElement('div');t.className='private-import-toast show';t.textContent=`✓ ${x.slug}: ${x.teams} squadre${x.free>=10?` e ${x.free} svincolati`:''} importati`;document.body.appendChild(t);setTimeout(()=>t.remove(),4500)},450)}
  setTimeout(bind,850);setTimeout(bind,1800);resultToast();
})();
