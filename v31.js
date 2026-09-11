/* Fanta Live 3.1.0 — filtri coerenti, opzioni Riparazione, sync squadre */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const REPAIR_KEY='fantaRepairV1';
  const MANUAL_KEY='fantaRepairLeagueSizeManualV31';
  const MINE_FILTER_KEY='fantaRepairMineFilterV31';
  const INJ_FILTER_KEY='fantaRepairInjuryFilterV1';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const readRepair=()=>{try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{teams:[],freeAgents:[],transactions:[]}}catch(e){return{teams:[],freeAgents:[],transactions:[]}}};
  const writeRepair=s=>localStorage.setItem(REPAIR_KEY,JSON.stringify(s));

  function isGenericTeam(t,i){
    const n=norm(t?.name);return !n||n==='la mia squadra'||n===`squadra ${i+1}`;
  }

  /* Il numero squadre arriva dall'Asta finché l'utente non lo cambia davvero nella Riparazione. */
  function syncLeagueSizeFromAuction(){
    let cfg=null;try{cfg=JSON.parse(localStorage.getItem('fantaCfgV5')||'null')}catch(e){}
    const n=Math.max(2,Math.round(+cfg?.teams||0));if(!Number.isFinite(n)||n<2)return false;
    const s=readRepair(),teams=Array.isArray(s.teams)?s.teams:[];
    const imported=/leghe/i.test(String(s.sourceName||''))&&teams.some((t,i)=>!isGenericTeam(t,i));
    const manual=localStorage.getItem(MANUAL_KEY)==='1';
    if(manual||imported)return false;
    const mismatch=Number(s.leagueSize)!==n||teams.length!==n;
    if(!mismatch)return false;
    const oldMine=teams.find(t=>t.mine)?.name||'';
    s.leagueSize=n;
    s.teams=Array.from({length:n},(_,i)=>{
      const old=teams[i];
      return old?{...old,id:old.id||`t${i+1}`}:{id:`t${i+1}`,name:i===0?'La mia squadra':`Squadra ${i+1}`,credits:0,mine:i===0};
    });
    if(oldMine){s.teams.forEach((t,i)=>t.mine=norm(t.name)===norm(oldMine)||(i===0&&!s.teams.some(x=>norm(x.name)===norm(oldMine))))}
    if(!s.teams.some(t=>t.mine)&&s.teams[0])s.teams[0].mine=true;
    s.leagueSizeSource='auction';writeRepair(s);return true;
  }

  function bindManualLeagueSize(){
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#applyLeagueSize'))localStorage.setItem(MANUAL_KEY,'1');
      if(e.target.closest?.('#repairReset')){localStorage.removeItem(MANUAL_KEY);localStorage.removeItem(MINE_FILTER_KEY)}
    },true);
  }

  function reorderAuctionFilters(){
    const box=document.querySelector('#auctionPanel .chips');if(!box)return;
    const find=v=>box.querySelector(`[data-f="${v}"]`);
    ['ALL','AVAILABLE','INJ','OWNED','P','D','C','A'].forEach(v=>{const x=find(v);if(x)box.appendChild(x)});
  }

  function ensureRepairMineChip(){
    const box=$('repairChips');if(!box)return null;
    let b=box.querySelector('[data-v31="MINE"]');
    if(!b){b=document.createElement('button');b.type='button';b.dataset.v31='MINE';b.textContent='Miei';b.className='repair-mine-chip-v31';box.appendChild(b)}
    return b;
  }

  function reorderRepairFilters(){
    const box=$('repairChips');if(!box)return;
    const mine=ensureRepairMineChip();
    const core=v=>box.querySelector(`[data-rf="${v}"]`);
    [core('ALL'),core('AVAILABLE'),core('INJ'),mine,core('P'),core('D'),core('C'),core('A')].filter(Boolean).forEach(x=>box.appendChild(x));
  }

  function setMineFilter(on){localStorage.setItem(MINE_FILTER_KEY,on?'1':'0')}
  function mineFilter(){return localStorage.getItem(MINE_FILTER_KEY)==='1'}

  function playerForTx(tx){
    const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[];
    const n=norm(tx.playerName);return live.find(p=>norm(p.name)===n)||live.find(p=>norm(p.alias||'')===n)||{name:tx.playerName,role:tx.role||'C',team:'',q:0,fvm:0};
  }
  function photoOf(p){try{return typeof img==='function'?img(p):`<div class="fallback">${esc(p.role||'C')}</div>`}catch(e){return `<div class="fallback">${esc(p.role||'C')}</div>`}}
  function tagsOf(p){try{return typeof tags==='function'?tags(p):''}catch(e){return ''}}

  function renderMine(){
    if(!mineFilter())return;
    const box=$('repairResults');if(!box)return;
    const s=readRepair(),mine=s.teams?.find(t=>t.mine)||s.teams?.[0];
    const q=norm($('repairSearch')?.value||'');
    let txs=(s.transactions||[]).filter(t=>mine&&String(t.teamId)===String(mine.id));
    if(q)txs=txs.filter(t=>norm(`${t.playerName} ${t.role||''}`).includes(q));
    txs=[...txs].reverse();
    box.innerHTML='<i class="v31-mine-marker"></i>'+ (txs.length?txs.map(t=>{
      const p=playerForTx(t),r=String(p.role||t.role||'C').toLowerCase();
      return `<div class="repair-player ${r} unavailable v31-owned" data-v31-owned="1"><div class="photo">${photoOf(p)}</div><div><div class="name">${esc(p.name||t.playerName)}</div><div class="meta">${esc(p.team||'')} · ${esc((p.role||t.role||'').toUpperCase())} · Qt ${+p.q||0} · FVM ${+p.fvm||0}</div><div class="tags">${tagsOf(p)}</div></div><div class="repair-price"><b>${esc(t.price)}</b><small>PAGATO</small></div></div>`;
    }).join(''):'<div class="repair-empty">Nessun giocatore acquistato dalla tua squadra in questa riparazione.</div>');
    const count=$('repairCount');if(count)count.textContent=`${txs.length} miei giocatori`;
    document.querySelectorAll('#repairChips [data-rf]').forEach(x=>x.classList.remove('active'));
    const chip=document.querySelector('#repairChips [data-v31="MINE"]');if(chip)chip.classList.add('active');
    syncRepairRoleVisual();
  }

  function bindMineFilter(){
    const box=$('repairChips');if(!box)return;
    box.addEventListener('click',e=>{
      const mine=e.target.closest?.('[data-v31="MINE"]');
      if(mine){
        e.preventDefault();e.stopPropagation();localStorage.setItem(INJ_FILTER_KEY,'0');
        const all=box.querySelector('[data-rf="ALL"]');setMineFilter(false);all?.click();setMineFilter(true);setTimeout(renderMine,20);return;
      }
      if(e.target.closest?.('[data-rf]')){setMineFilter(false);setTimeout(syncRepairRoleVisual,20)}
    },true);
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-role-stat]')){setMineFilter(false);setTimeout(syncRepairRoleVisual,20)}},true);
    $('repairSearch')?.addEventListener('input',()=>{if(mineFilter())setTimeout(renderMine,0)});
    const results=$('repairResults');if(results)new MutationObserver(()=>{if(mineFilter()&&!results.querySelector('.v31-mine-marker'))requestAnimationFrame(renderMine)}).observe(results,{childList:true});
  }

  function syncRepairRoleVisual(){
    const box=$('repairRoleStats');if(!box)return;
    const active=[...box.querySelectorAll('.repair-role-stat')].some(x=>x.classList.contains('active'));
    box.classList.toggle('v31-role-filtering',active&&!mineFilter()&&localStorage.getItem(INJ_FILTER_KEY)!=='1');
  }

  function bindRepairRoleVisual(){
    const box=$('repairRoleStats');if(!box)return;
    new MutationObserver(syncRepairRoleVisual).observe(box,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-role-stat],#repairChips'))setTimeout(syncRepairRoleVisual,20)});
    syncRepairRoleVisual();
  }

  /* Import Lega, svincolati e gestione squadre vivono solo dentro Opzioni. */
  function moveRepairToolsIntoSettings(){
    const sheet=document.querySelector('#repairSetupModal .setup-sheet');if(!sheet)return;
    let tools=sheet.querySelector('.repair-tools-v31');
    if(!tools){
      tools=document.createElement('section');tools.className='repair-tools-v31';
      tools.innerHTML='<h4>Importazione</h4><p>Da qui importi la lega o il file svincolati. “Importa Lega” funziona da qualunque pagina della tua lega già aperta nel browser: non serve trovare /squadre.</p><div class="repair-tools-grid"></div>';
      const help=sheet.querySelector('.repair-help');help?.insertAdjacentElement('afterend',tools);
      const teamTitle=document.createElement('h4');teamTitle.className='repair-teams-title-v31';teamTitle.textContent='Squadre e crediti';tools.insertAdjacentElement('afterend',teamTitle);
    }
    const grid=tools.querySelector('.repair-tools-grid');
    const free=$('importFreeBtn'),league=$('importDirectLeagueBtn')||$('importLeagueBtn')||$('importCreditsBtn');
    if(free&&free.parentElement!==grid){free.textContent='📥 Importa svincolati';grid.appendChild(free)}
    if(league&&league.parentElement!==grid){league.textContent='🔐 Importa Lega';grid.appendChild(league)}
    const f1=$('repairFreeFile'),f2=$('repairCreditsFile');if(f1&&f1.parentElement!==tools)tools.appendChild(f1);if(f2&&f2.parentElement!==tools)tools.appendChild(f2);
    const h=sheet.querySelector(':scope > h3');if(h)h.textContent='Opzioni riparazione';
    const p=sheet.querySelector(':scope > .repair-help');if(p)p.textContent='Importa i dati oppure modifica manualmente squadre e crediti.';
    const gear=$('repairSettingsBtn');if(gear)gear.title='Opzioni riparazione';
  }

  /* Controlli Riparazione nella stessa posizione/dimensione di Undo e Opzioni dell'Asta. */
  function ensureRepairTopControls(){
    const controls=document.querySelector('.app-shell-controls');if(!controls)return;
    let box=controls.querySelector('.repair-top-actions-v31');
    if(!box){
      box=document.createElement('div');box.className='repair-top-actions-v31';
      box.innerHTML='<button class="icon" id="repairUndoV31" title="Annulla ultimo movimento">↶</button><button class="icon" id="repairSettingsV31" title="Opzioni riparazione">⚙️</button>';
      controls.appendChild(box);
      $('repairSettingsV31').onclick=()=>$('repairSettingsBtn')?.click();
      $('repairUndoV31').onclick=()=>{const u=document.querySelector('#repairTransactions [data-tx]');if(u)u.click()};
    }
    const s=readRepair();const undo=$('repairUndoV31');if(undo)undo.disabled=!(s.transactions&&s.transactions.length);
  }

  function polishDirectImporter(){
    const modal=$('directLegheModal');if(!modal)return;
    const h=modal.querySelector('.leghe-import-head h3');if(h)h.textContent='Importa da qualsiasi pagina Leghe';
    const p=modal.querySelector('.repair-help');if(p)p.innerHTML='Non devi cercare <b>/squadre</b> e non serve un link particolare. Apri una qualsiasi pagina della tua lega già autenticata e avvia <b>Fanta Live Import</b>: vengono letti squadre, crediti, rose e svincolati.';
    const st=$('directStatus');if(st&&!/copiato|errore/i.test(st.textContent||''))st.textContent='Va bene home lega, mercato, formazione, classifica o qualsiasi altra pagina della stessa lega.';
  }

  function bind(){
    bindManualLeagueSize();
    if(syncLeagueSizeFromAuction()&&!sessionStorage.getItem('fantaV31Synced')){sessionStorage.setItem('fantaV31Synced','1');location.reload();return}
    reorderAuctionFilters();reorderRepairFilters();bindMineFilter();bindRepairRoleVisual();
    moveRepairToolsIntoSettings();ensureRepairTopControls();polishDirectImporter();
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#repairSettingsBtn,#repairSettingsV31'))setTimeout(moveRepairToolsIntoSettings,20);
      if(e.target.closest?.('#importDirectLeagueBtn,#importLeagueBtn,#importCreditsBtn'))setTimeout(polishDirectImporter,40);
    });
    const tx=$('repairTransactions');if(tx)new MutationObserver(()=>{ensureRepairTopControls();if(mineFilter())setTimeout(renderMine,0)}).observe(tx,{childList:true,subtree:true});
    const chips=$('repairChips');if(chips)new MutationObserver(()=>{reorderRepairFilters();syncRepairRoleVisual()}).observe(chips,{childList:true});
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 3.1.0 · Liquid Glass';
    setTimeout(()=>{reorderAuctionFilters();reorderRepairFilters();moveRepairToolsIntoSettings();ensureRepairTopControls();polishDirectImporter();syncRepairRoleVisual();if(mineFilter())renderMine()},700);
    setTimeout(()=>{moveRepairToolsIntoSettings();ensureRepairTopControls();polishDirectImporter();syncRepairRoleVisual()},2400);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
