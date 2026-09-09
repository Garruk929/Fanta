/* Fanta Live 2.2 — import Leghe da iPhone + filtri ruolo sincronizzati */
(function(){
  'use strict';
  const APP_URL='https://garruk929.github.io/Fanta/?v=2.2.0#import-leghe';
  const $=id=>document.getElementById(id);
  const nrm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function captureBookmarklet(){
    const code=`(()=>{try{const payload={fantaLivePage:1,url:location.href,title:document.title,text:document.body.innerText,createdAt:Date.now()},txt=JSON.stringify(payload),go=()=>{alert('Fanta Live: pagina copiata. Ora importala dagli appunti.');location.href='${APP_URL}'};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(go).catch(()=>{const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();go()})}else{const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();go()}}catch(e){alert('Fanta Live: '+e.message)}})()`;
    return 'javascript:'+code.replace(/\s+/g,' ');
  }

  function leagueBase(input){
    let raw=String(input||'').trim();
    if(!raw)throw new Error('Incolla il link della tua lega.');
    if(!/^https?:\/\//i.test(raw))raw='https://'+raw;
    const u=new URL(raw),parts=u.pathname.split('/').filter(Boolean);
    if(!/leghe\.fantacalcio\.it$/i.test(u.hostname)||!parts.length)throw new Error('Serve un link di leghe.fantacalcio.it.');
    return {slug:parts[0],base:`https://leghe.fantacalcio.it/${parts[0]}`};
  }

  async function jina(url){
    const clean=url.replace(/^https?:\/\//,'');
    const r=await fetch('https://r.jina.ai/http://'+clean,{cache:'no-store'});
    if(!r.ok)throw new Error('Pagina Leghe non leggibile (HTTP '+r.status+').');
    return await r.text();
  }

  function parseTeamsText(text){
    const teams=[];
    const budgets=[...text.matchAll(/(\d+)\s+Budget disponibile/gi)].map(m=>Number(m[1]));
    const cardNames=[];
    const re=/Divisione\s+[^\n]+\n+#{3,6}\s*([^\n#]+)\n/gi;
    let m;
    while((m=re.exec(text))){const name=String(m[1]||'').trim();if(name&&!cardNames.some(x=>nrm(x)===nrm(name)))cardNames.push(name)}
    if(budgets.length&&cardNames.length>=budgets.length){for(let i=0;i<budgets.length;i++)teams.push({name:cardNames[i],credits:budgets[i]})}
    if(!teams.length){
      const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      for(let i=0;i<lines.length;i++){
        const bm=lines[i].match(/^(\d+)\s+Budget disponibile/i);if(!bm)continue;
        let name='';
        for(let j=i-1;j>=0&&j>=i-4;j--){if(/^Divisione\b/i.test(lines[j]))continue;if(/Budget disponibile/i.test(lines[j]))continue;if(lines[j].length>1){name=lines[j];break}}
        if(name)teams.push({name:name.replace(/^#+\s*/,''),credits:Number(bm[1])})
      }
    }
    const out=[],seen=new Set();for(const t of teams){const k=nrm(t.name);if(k&&!seen.has(k)){seen.add(k);out.push(t)}}return out;
  }

  function playersVisibleInText(text){
    const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[];
    const hay=' '+nrm(text)+' ';
    return live.filter(p=>{const name=nrm(p.name);return name.length>=4&&hay.includes(' '+name+' ')});
  }

  function saveTeams(teams,source){
    let state=null;try{state=JSON.parse(localStorage.getItem('fantaRepairV1')||'null')}catch(e){}
    state=state||{version:3,sourceName:'',freeAgents:[],teams:[],transactions:[],filter:'ALL'};
    const oldMine=state.teams?.find(t=>t.mine)?.name||'';
    state.teams=teams.map((t,i)=>({id:'pub'+(i+1),name:t.name,credits:Math.max(0,Math.round(+t.credits||0)),mine:oldMine?nrm(t.name)===nrm(oldMine):i===0}));
    if(!state.teams.some(t=>t.mine)&&state.teams[0])state.teams[0].mine=true;
    state.leagueSize=teams.length;
    state.sourceName=source||state.sourceName;state.version=3;
    localStorage.setItem('fantaRepairV1',JSON.stringify(state));localStorage.setItem('fantaModeV2','repair');
    return state;
  }

  function saveFree(players,source){
    let state=null;try{state=JSON.parse(localStorage.getItem('fantaRepairV1')||'null')}catch(e){}
    state=state||{version:3,sourceName:'',freeAgents:[],teams:[],transactions:[],filter:'ALL'};
    const map=new Map();for(const p of players||[]){if(p?.name&&p?.role)map.set(`${nrm(p.name)}|${p.role}`,{...p})}
    if(map.size)state.freeAgents=[...map.values()];
    state.sourceName=source||state.sourceName;state.transactions=[];state.version=3;
    localStorage.setItem('fantaRepairV1',JSON.stringify(state));localStorage.setItem('fantaModeV2','repair');
    return state;
  }

  async function importUrl(){
    const status=$('legheImportStatus');status.textContent='Lettura pagina squadre…';
    const {slug,base}=leagueBase($('legheUrl').value);
    const squadText=await jina(base+'/squadre?all=true');
    const teams=parseTeamsText(squadText);
    if(!teams.length)throw new Error('Non sono riuscito a leggere squadre e crediti dalla pagina pubblica. Usa “Cattura pagina Safari”.');
    saveTeams(teams,'Leghe · '+slug+' · URL');
    let free=[];
    try{status.textContent=`✓ ${teams.length} squadre. Provo a leggere anche gli svincolati…`;const marketText=await jina(base+'/market/players?releaseds=');free=playersVisibleInText(marketText);if(free.length>=20)saveFree(free,'Leghe · '+slug+' · URL')}catch(e){}
    status.textContent=`✓ ${teams.length} squadre/crediti importati${free.length>=20?` · ${free.length} svincolati trovati`:' · per gli svincolati usa il file .fclist o la cattura Safari della Lista Svincolati'}.`;
    setTimeout(()=>location.replace('https://garruk929.github.io/Fanta/?v=2.3.0#repair'),900);
  }

  async function importClipboard(){
    const status=$('legheImportStatus');status.textContent='Lettura appunti…';
    const raw=await navigator.clipboard.readText(),data=JSON.parse(raw);
    if(!data||data.fantaLivePage!==1||!data.text)throw new Error('Negli appunti non c’è una cattura Fanta Live valida.');
    const url=String(data.url||''),text=String(data.text||'');
    if(/\/squadre/i.test(url)){
      const teams=parseTeamsText(text);if(!teams.length)throw new Error('Nella cattura non trovo squadre con “Budget disponibile”.');saveTeams(teams,'Leghe · cattura Safari');status.textContent=`✓ Importate ${teams.length} squadre con i crediti.`;
    }else if(/market\/players|svincolat/i.test(url+data.title)){
      const free=playersVisibleInText(text);if(!free.length)throw new Error('Nella pagina catturata non riconosco giocatori del listone.');saveFree(free,'Leghe · Lista Svincolati');status.textContent=`✓ Riconosciuti ${free.length} svincolati visibili nella pagina.`;
    }else throw new Error('Apri su Leghe la pagina “Squadre” oppure “Lista Svincolati” e rilancia il preferito.');
    localStorage.setItem('fantaModeV2','repair');setTimeout(()=>location.replace('https://garruk929.github.io/Fanta/?v=2.3.0#repair'),800);
  }

  function injectImporter(){
    if($('legheImportModal'))return;
    const o=document.createElement('div');o.className='overlay';o.id='legheImportModal';
    o.innerHTML=`<div class="repair-sheet leghe-import-sheet"><div class="grab"></div><div class="leghe-import-head"><div><span class="repair-kicker">IMPORT LEGA DA IPHONE</span><h3>Leghe → Fanta Live</h3></div><span class="leghe-lock">🔒 senza password</span></div><p class="repair-help">Metodo mobile senza inserire credenziali in Fanta Live. Prova prima il link pubblico della lega; se la pagina è privata, usa la cattura Safari della pagina già aperta sul tuo iPhone.</p><label class="repair-field">Link della lega<input id="legheUrl" type="url" inputmode="url" placeholder="https://leghe.fantacalcio.it/nome-lega/squadre"></label><button class="repair-confirm" id="importLegheUrl">🌐 Importa da link lega</button><div class="leghe-divider"><span>oppure da Safari</span></div><div class="leghe-steps"><div><b>1</b><span>Copia il mini-importer e salvalo una volta come URL di un preferito Safari chiamato <strong>Fanta Live Import</strong>.</span></div><div><b>2</b><span>Su Leghe apri <strong>Squadre</strong> (per nomi/crediti) oppure <strong>Lista Svincolati</strong>, poi tocca il preferito.</span></div><div><b>3</b><span>Fanta Live si riapre: premi <strong>Importa dagli appunti</strong>.</span></div></div><button class="wide" id="copyLegheCapture">📋 Copia cattura Safari</button><button class="wide" id="openLegheSite">Apri Leghe Fantacalcio ↗</button><button class="repair-confirm" id="pasteLegheData">📲 Importa dagli appunti</button><button class="wide" id="legheFileFallback">📄 Importa file / JSON</button><div class="leghe-status" id="legheImportStatus">Nessun import eseguito.</div><button class="repair-close" id="closeLegheImport">Chiudi</button></div>`;
    document.body.appendChild(o);
    $('closeLegheImport').onclick=()=>o.classList.remove('show');o.onclick=e=>{if(e.target===o)o.classList.remove('show')};
    $('importLegheUrl').onclick=()=>importUrl().catch(e=>$('legheImportStatus').textContent='Errore: '+e.message);
    $('copyLegheCapture').onclick=async()=>{const code=captureBookmarklet();try{await navigator.clipboard.writeText(code);$('legheImportStatus').textContent='✓ Codice copiato. Modifica un preferito Safari e incollalo al posto dell’indirizzo.'}catch(e){prompt('Copia questo indirizzo nel preferito Safari:',code)}};
    $('openLegheSite').onclick=()=>window.open('https://leghe.fantacalcio.it/','_blank','noopener');
    $('pasteLegheData').onclick=()=>importClipboard().catch(e=>$('legheImportStatus').textContent='Errore: '+e.message);
    $('legheFileFallback').onclick=()=>{o.classList.remove('show');$('repairCreditsFile')?.click()};
  }

  function openImporter(){injectImporter();$('legheImportModal').classList.add('show')}
  function setupImporter(){injectImporter();const b=$('importCreditsBtn');if(b){b.textContent='📱 Importa da Leghe';b.onclick=openImporter;b.title='Importa squadre, crediti e dati Leghe da iPhone'}if(location.hash==='#import-leghe')setTimeout(openImporter,350)}

  function syncAuctionRoles(){
    const box=$('roles');if(!box)return;const active=document.querySelector('.chips .chip.active[data-f]'),f=active?.dataset.f||'ALL',isRole=/^[PDCA]$/.test(f);box.classList.toggle('role-filtering',isRole);
    box.querySelectorAll('.role').forEach(card=>{const r=['P','D','C','A'].find(x=>card.classList.contains(x.toLowerCase()));if(!r)return;card.classList.toggle('filter-active',isRole&&r===f);card.setAttribute('role','button');card.setAttribute('tabindex','0');const go=()=>document.querySelector(`.chips .chip[data-f="${isRole&&r===f?'ALL':r}"]`)?.click();card.onclick=go;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  }
  function setupRoleSync(){const box=$('roles');if(!box)return;new MutationObserver(syncAuctionRoles).observe(box,{childList:true,subtree:true});document.querySelector('.chips')?.addEventListener('click',()=>setTimeout(syncAuctionRoles,0));syncAuctionRoles()}

  setupImporter();setupRoleSync();
})();

/* carica i perfezionamenti 2.3 senza cambiare il markup base */
(function(){
  if(!document.querySelector('link[data-fanta-v23]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v23.css?v=2.3.0';l.dataset.fantaV23='1';document.head.appendChild(l)}
  if(!document.querySelector('script[data-fanta-v23]')){const s=document.createElement('script');s.src='v23.js?v=2.3.0';s.dataset.fantaV23='1';document.body.appendChild(s)}
})();