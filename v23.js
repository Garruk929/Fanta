/* Fanta Live 2.3.5 — pulizia UI riparazione, testata compatta e import Leghe semplificato */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const repairKey='fantaRepairV1';
  const APP_URL='https://garruk929.github.io/Fanta/?v=2.3.5#repair';

  function readRepair(){try{return JSON.parse(localStorage.getItem(repairKey)||'null')||{teams:[],freeAgents:[],transactions:[]}}catch(e){return{teams:[],freeAgents:[],transactions:[]}}}
  function writeRepair(s){localStorage.setItem(repairKey,JSON.stringify(s))}
  function genericTeam(t,i){const n=norm(t?.name);if(i===0)return !n||n==='la mia squadra'||n==='squadra 1';return !n||n===`squadra ${i+1}`}
  function knownLeague(state=readRepair()){
    const teams=Array.isArray(state.teams)?state.teams:[];
    if(Number(state.leagueSize)>=2)return true;
    if(teams.length<2)return false;
    const allGeneric=teams.every(genericTeam),hasCredits=teams.some(t=>(+t.credits||0)>0);
    return !allGeneric||hasCredits;
  }
  function leagueCount(state=readRepair()){return knownLeague(state)?(Number(state.leagueSize)||state.teams.length):0}
  function season(){const d=new Date(),y=d.getFullYear(),m=d.getMonth()+1;return m>=7?`${y}/${String(y+1).slice(2)}`:`${y-1}/${String(y).slice(2)}`}

  function syncVersion(){const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 2.3.5'}
  function syncGlobalSub(){
    const sub=$('headerSub');if(!sub)return;
    if(document.body.classList.contains('repair-mode')){
      const n=leagueCount();sub.textContent=`Riparazione${n?` • ${n} squadre`:''} • ${season()}`;
    }else{
      let c={budget:500,teams:8,slots:{P:3,D:8,C:8,A:6}};try{c=JSON.parse(localStorage.getItem('fantaCfgV5')||'null')||c}catch(e){}
      const total=Object.values(c.slots||{}).reduce((a,b)=>a+(+b||0),0);sub.textContent=`${c.teams||8} squadre • ${c.budget||500} crediti • ${total||25} giocatori • ${season()}`;
    }
  }

  function moveSwitchUnderTitle(){
    const nav=document.querySelector('.mode-tabs'),brand=document.querySelector('#auctionPanel .brand-left'),actions=document.querySelector('#auctionPanel .brand-actions');
    if(!nav||!brand)return;
    let shell=document.querySelector('.app-shell-head');
    if(!shell){
      shell=document.createElement('div');shell.className='app-shell-head';
      const row=document.createElement('div');row.className='app-shell-brand';row.appendChild(brand);shell.appendChild(row);
      const controls=document.createElement('div');controls.className='app-shell-controls';controls.appendChild(nav);if(actions)controls.appendChild(actions);shell.appendChild(controls);
      document.body.insertBefore(shell,document.body.firstChild);
    }else{
      let controls=shell.querySelector('.app-shell-controls');
      if(!controls){controls=document.createElement('div');controls.className='app-shell-controls';shell.appendChild(controls)}
      if(nav.parentElement!==controls)controls.appendChild(nav);
      if(actions&&actions.parentElement!==controls)controls.appendChild(actions);
    }
    nav.querySelectorAll('.mode-tab').forEach(b=>{if(!b.dataset.shellBound){b.dataset.shellBound='1';b.addEventListener('click',()=>setTimeout(syncGlobalSub,0))}});
    syncGlobalSub();
  }

  function syncRepairTeamsUI(){
    const state=readRepair(),ready=knownLeague(state),n=leagueCount(state);document.body.classList.toggle('repair-teams-ready',ready);
    if(ready&&Number(state.leagueSize)!==n){state.leagueSize=n;writeRepair(state)}
    if(!ready){
      if($('repairMyCredits')&&$('repairMyCredits').textContent!=='—')$('repairMyCredits').textContent='—';
      if($('repairRank')&&$('repairRank').textContent!=='Imposta numero squadre')$('repairRank').textContent='Imposta numero squadre';
      if($('repairSummary'))$('repairSummary').innerHTML='<strong>Prima configura la lega.</strong> Scegli il numero di squadre oppure importale da Leghe Fantacalcio; i riquadri con i crediti compariranno solo dopo.';
    }
    syncGlobalSub();
  }

  function setupLeagueSizeBox(){
    const editor=$('repairTeamsEditor');if(!editor||$('leagueSizeBox'))return;
    const box=document.createElement('div');box.className='league-size-box';box.id='leagueSizeBox';
    box.innerHTML='<label><span>Numero squadre della lega</span><input id="leagueSizeInput" type="number" inputmode="numeric" min="2" max="30" placeholder="es. 8"></label><button id="applyLeagueSize">Crea / aggiorna squadre</button><div class="league-size-hint">Finché questo dato non è impostato, Fanta Live non mostra squadre o crediti fittizi.</div>';
    editor.parentNode.insertBefore(box,editor);
    $('applyLeagueSize').onclick=()=>{
      const raw=Math.round(Number($('leagueSizeInput').value));if(!Number.isFinite(raw)||raw<2)return alert('Inserisci il numero di squadre della lega.');const n=Math.min(30,raw);
      const state=readRepair(),old=Array.isArray(state.teams)?state.teams:[];
      state.leagueSize=n;state.teams=Array.from({length:n},(_,i)=>old[i]?{...old[i],id:old[i].id||`t${i+1}`}:{id:`t${i+1}`,name:i===0?'La mia squadra':`Squadra ${i+1}`,credits:0,mine:i===0});
      if(!state.teams.some(t=>t.mine)&&state.teams[0])state.teams[0].mine=true;
      writeRepair(state);localStorage.setItem('fantaModeV2','repair');location.reload();
    };
  }

  function syncSetupModal(){
    setupLeagueSizeBox();const modal=$('repairSetupModal'),state=readRepair(),ready=knownLeague(state),n=leagueCount(state);if(!modal)return;
    modal.querySelector('.setup-sheet')?.classList.toggle('setup-unconfigured',!ready);
    const input=$('leagueSizeInput');if(input)input.value=ready?n:'';
  }

  function addLegheLinkHelp(){
    const sheet=document.querySelector('.leghe-import-sheet');if(!sheet||sheet.querySelector('.leghe-link-help'))return;
    const label=$('legheUrl')?.closest('label');if(!label)return;
    const help=document.createElement('div');help.className='leghe-link-help';
    help.innerHTML='<b>Non serve cercare /squadre.</b><br>Apri in Safari <b>una qualsiasi pagina della tua lega</b> e copia l’indirizzo. Fanta Live riconosce automaticamente il nome della lega e prova da solo la pagina corretta con squadre e crediti. Va bene anche un link a classifica, mercato, info squadra o home della lega.';
    label.insertAdjacentElement('afterend',help);
  }

  function parseLeagueInput(input){
    let raw=String(input||'').trim();
    if(!raw)throw new Error('Incolla un qualsiasi link della tua lega.');
    if(!/^https?:\/\//i.test(raw)){
      if(/^[a-z0-9][a-z0-9-]*$/i.test(raw))raw='https://leghe.fantacalcio.it/'+raw;
      else raw='https://'+raw;
    }
    const u=new URL(raw);
    if(!/(^|\.)leghe\.fantacalcio\.it$/i.test(u.hostname))throw new Error('Il link deve provenire da leghe.fantacalcio.it.');
    let parts=u.pathname.split('/').filter(Boolean);
    if(!parts.length&&u.hash)parts=u.hash.replace(/^#/,'').split('/').filter(Boolean);
    if(!parts.length)throw new Error('Apri prima la tua lega, poi copia un link da una sua pagina.');
    const slug=parts[0];
    return {slug,base:`https://leghe.fantacalcio.it/${slug}`,exact:u.href};
  }

  async function jina(url){
    const clean=String(url).replace(/^https?:\/\//,'');
    const r=await fetch('https://r.jina.ai/http://'+clean,{cache:'no-store'});
    if(!r.ok)throw new Error('Pagina non leggibile (HTTP '+r.status+').');
    return await r.text();
  }

  function parseTeamsText(text){
    const teams=[];
    const budgets=[...String(text||'').matchAll(/(\d+)\s+Budget disponibile/gi)].map(m=>Number(m[1]));
    const cardNames=[];
    const re=/Divisione\s+[^\n]+\n+#{3,6}\s*([^\n#]+)\n/gi;
    let m;
    while((m=re.exec(text))){const name=String(m[1]||'').trim();if(name&&!cardNames.some(x=>norm(x)===norm(name)))cardNames.push(name)}
    if(budgets.length&&cardNames.length>=budgets.length){for(let i=0;i<budgets.length;i++)teams.push({name:cardNames[i],credits:budgets[i]})}
    if(!teams.length){
      const lines=String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      for(let i=0;i<lines.length;i++){
        const bm=lines[i].match(/^(\d+)\s+Budget disponibile/i);if(!bm)continue;
        let name='';
        for(let j=i-1;j>=0&&j>=i-5;j--){if(/^Divisione\b/i.test(lines[j]))continue;if(/Budget disponibile/i.test(lines[j]))continue;if(/^Image$/i.test(lines[j]))continue;if(lines[j].length>1){name=lines[j];break}}
        if(name)teams.push({name:name.replace(/^#+\s*/,''),credits:Number(bm[1])})
      }
    }
    const out=[],seen=new Set();for(const t of teams){const k=norm(t.name);if(k&&!seen.has(k)){seen.add(k);out.push(t)}}return out;
  }

  function saveImportedTeams(teams,source){
    const state=readRepair(),oldMine=state.teams?.find(t=>t.mine)?.name||'';
    state.teams=teams.map((t,i)=>({id:'pub'+(i+1),name:t.name,credits:Math.max(0,Math.round(+t.credits||0)),mine:oldMine?norm(t.name)===norm(oldMine):i===0}));
    if(!state.teams.some(t=>t.mine)&&state.teams[0])state.teams[0].mine=true;
    state.leagueSize=teams.length;state.sourceName=source;state.version=4;
    writeRepair(state);localStorage.setItem('fantaModeV2','repair');
  }

  function playersVisibleInText(text){
    const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[];
    const hay=' '+norm(text)+' ';
    return live.filter(p=>{const name=norm(p.name);return name.length>=4&&hay.includes(' '+name+' ')})
  }

  function saveImportedFree(players,source){
    if(!players?.length)return;
    const state=readRepair(),map=new Map();for(const p of players){if(p?.name&&p?.role)map.set(`${norm(p.name)}|${p.role}`,{...p})}
    if(map.size)state.freeAgents=[...map.values()];
    state.sourceName=source||state.sourceName;state.transactions=[];state.version=4;writeRepair(state);
  }

  async function importAnyLeagueLink(raw){
    const status=$('legheImportStatus'),info=parseLeagueInput(raw);
    const candidates=[info.exact,info.base+'/squadre?all=true',info.base+'/squadre',info.base];
    let teams=[],used='';
    for(const url of [...new Set(candidates)]){
      try{
        status.textContent='Cerco automaticamente squadre e crediti…';
        const txt=await jina(url),found=parseTeamsText(txt);
        if(found.length>=2){teams=found;used=url;break}
      }catch(e){}
    }
    if(!teams.length)throw new Error('Ho riconosciuto la lega ma non riesco a leggere squadre e crediti dalla parte pubblica. In quel caso usa la cattura Safari già autenticata.');
    saveImportedTeams(teams,'Leghe · '+info.slug+' · automatico');
    let free=[];
    try{
      status.textContent=`✓ ${teams.length} squadre importate. Cerco anche gli svincolati…`;
      const txt=await jina(info.base+'/market/players?releaseds=');free=playersVisibleInText(txt);if(free.length>=20)saveImportedFree(free,'Leghe · '+info.slug+' · automatico');
    }catch(e){}
    status.textContent=`✓ Import completato: ${teams.length} squadre con crediti${free.length>=20?` · ${free.length} svincolati trovati`:''}.`;
    setTimeout(()=>location.replace(APP_URL),700);
    return used;
  }

  async function pasteAndImport(){
    const input=$('legheUrl'),status=$('legheImportStatus');let raw=String(input?.value||'').trim();
    if(!raw){
      status.textContent='Leggo il link dagli appunti…';
      try{raw=String(await navigator.clipboard.readText()).trim()}catch(e){throw new Error('Non riesco a leggere gli appunti. Incolla il link nel campo qui sopra.')}
      if(input)input.value=raw;
    }
    return importAnyLeagueLink(raw);
  }

  function upgradeLegheImporter(){
    const modal=$('legheImportModal'),input=$('legheUrl'),button=$('importLegheUrl');if(!modal||!input||!button)return;
    if(modal.dataset.easyImport==='1')return;modal.dataset.easyImport='1';
    const label=input.closest('label');if(label){label.childNodes[0].textContent='Qualsiasi link della tua lega';}
    input.placeholder='https://leghe.fantacalcio.it/nome-lega/qualsiasi-pagina';
    button.textContent='📋 Incolla link e importa';
    button.onclick=()=>pasteAndImport().catch(e=>{const s=$('legheImportStatus');if(s)s.textContent='Errore: '+e.message});
    const intro=modal.querySelector('.repair-help');if(intro)intro.textContent='Metodo più semplice: copia da Safari qualsiasi indirizzo mentre sei dentro la tua lega. Non serve trovare la pagina Squadre e non serve inserire password.';
    const open=$('openLegheSite');if(open){open.textContent='Apri Leghe Fantacalcio in Safari ↗';open.title='Apri il sito, entra nella tua lega e copia qualsiasi indirizzo della lega'}
    addLegheLinkHelp();
  }

  function watch(){
    const strip=$('repairPowerStrip');if(strip)new MutationObserver(()=>requestAnimationFrame(syncRepairTeamsUI)).observe(strip,{childList:true});
    ['repairSetupBtn','repairSettingsBtn'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(syncSetupModal,0)));
    const importBtn=$('importCreditsBtn');if(importBtn)importBtn.addEventListener('click',()=>setTimeout(()=>{addLegheLinkHelp();upgradeLegheImporter()},0));
    document.addEventListener('click',e=>{if(e.target?.id==='importCreditsBtn')setTimeout(()=>{addLegheLinkHelp();upgradeLegheImporter()},0)});
    setTimeout(()=>{syncRepairTeamsUI();syncSetupModal();addLegheLinkHelp();upgradeLegheImporter();syncVersion();moveSwitchUnderTitle()},250);
    setTimeout(()=>{syncRepairTeamsUI();upgradeLegheImporter()},1200);
  }

  moveSwitchUnderTitle();watch();syncVersion();
})();