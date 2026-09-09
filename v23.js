/* Fanta Live 2.3 — pulizia UI riparazione e configurazione squadre */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const repairKey='fantaRepairV1';

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

  function syncVersion(){const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 2.3.0'}
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
    const nav=document.querySelector('.mode-tabs'),brand=document.querySelector('#auctionPanel .brand-left');if(!nav||!brand||document.querySelector('.app-shell-head'))return;
    const shell=document.createElement('div');shell.className='app-shell-head';
    const row=document.createElement('div');row.className='app-shell-brand';row.appendChild(brand);shell.appendChild(row);shell.appendChild(nav);
    document.body.insertBefore(shell,document.body.firstChild);
    nav.querySelectorAll('.mode-tab').forEach(b=>b.addEventListener('click',()=>setTimeout(syncGlobalSub,0)));
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
    help.innerHTML='<b>Dove trovo il link?</b><br>Su iPhone apri <b>Safari</b> → <b>leghe.fantacalcio.it</b> → accedi → apri la tua lega → entra in <b>Squadre</b> → tocca la barra indirizzi e fai <b>Copia</b>. È un indirizzo simile a <code>https://leghe.fantacalcio.it/nome-della-lega/squadre</code>. Se stai usando solo l’app Leghe, apri prima il sito in Safari: nell’app non hai la barra URL.';
    label.insertAdjacentElement('afterend',help);
  }

  function watch(){
    const strip=$('repairPowerStrip');if(strip)new MutationObserver(()=>requestAnimationFrame(syncRepairTeamsUI)).observe(strip,{childList:true});
    ['repairSetupBtn','repairSettingsBtn'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(syncSetupModal,0)));
    const importBtn=$('importCreditsBtn');if(importBtn)importBtn.addEventListener('click',()=>setTimeout(addLegheLinkHelp,0));
    document.addEventListener('click',e=>{if(e.target?.id==='importCreditsBtn')setTimeout(addLegheLinkHelp,0)});
    setTimeout(()=>{syncRepairTeamsUI();syncSetupModal();addLegheLinkHelp();syncVersion()},250);
    setTimeout(syncRepairTeamsUI,1200);
  }

  moveSwitchUnderTitle();watch();syncVersion();
})();