/* Fanta Live 2.7.0 — scheda giocatore completa nella Riparazione */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const FILTER_KEY='fantaRepairInjuryFilterV1';
  const REPAIR_KEY='fantaRepairV1';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function injuryMode(){return localStorage.getItem(FILTER_KEY)==='1'}
  function setInjuryMode(v){localStorage.setItem(FILTER_KEY,v?'1':'0')}
  function readRepair(){try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{freeAgents:[]}}catch(e){return{freeAgents:[]}}}

  function resolvePlayer(name,team,role){
    const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[];
    const n=norm(name),t=norm(team);
    let p=live.find(x=>norm(x.name)===n);
    if(!p)p=live.find(x=>norm(x.alias||'')===n);
    if(!p){
      const same=live.filter(x=>norm(x.name).includes(n)||n.includes(norm(x.name)));
      p=same.find(x=>!t||norm(x.team)===t)||same[0];
    }
    return p||{name:String(name||''),team:String(team||''),role:String(role||'C').toUpperCase(),q:0,fvm:0};
  }

  function healthOf(p){try{return typeof health==='function'?health(p):null}catch(e){return null}}
  function profileOf(p){
    try{if(typeof profile==='function')return profile(p)}catch(e){}
    const r=String(p.role||'').toUpperCase();
    if(r==='P')return 'Portiere da valutare per titolarità, affidabilità e rapporto qualità/prezzo.';
    if(r==='D')return 'Difensore da valutare per titolarità, voto medio, modificatore e possibili bonus.';
    if(r==='C')return 'Centrocampista da valutare per titolarità, inserimenti, bonus e peso sui piazzati.';
    return 'Attaccante da valutare per minutaggio, continuità realizzativa e rapporto tra costo e potenziale.';
  }

  function penaltyInfo(p){
    try{
      if(typeof PEN!=='undefined'){
        const list=PEN[p.team]||[],i=list.indexOf(p.name);
        if(i>=0)return {yes:true,text:i===0?'Prima scelta dal dischetto':`Gerarchia rigori #${i+1}`};
      }
    }catch(e){}
    const tag=$('repairPlayerTags')?.querySelector('.tag.pen');
    return tag?{yes:true,text:tag.textContent.replace(/^🎯\s*/,'').trim()}:{yes:false,text:'Nessun ruolo da rigorista segnalato'};
  }

  function currentPlayer(){
    const name=$('repairPlayerName')?.textContent.trim()||'';
    const meta=$('repairPlayerMeta')?.textContent||'';
    const parts=meta.split('·').map(x=>x.trim());
    const team=parts[0]||'';
    const role=(parts[1]||'C').trim().charAt(0).toUpperCase();
    return resolvePlayer(name,team,role);
  }

  function ensureInjuryChip(){
    const box=$('repairChips');if(!box)return null;
    let b=box.querySelector('[data-rf="INJ"]');
    if(!b){
      b=document.createElement('button');b.dataset.rf='INJ';b.className='repair-injury-chip';b.innerHTML='🔴 Infortunati';
      const available=box.querySelector('[data-rf="AVAILABLE"]');
      if(available)box.insertBefore(b,available);else box.appendChild(b);
      b.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const all=box.querySelector('[data-rf="ALL"]');
        if(all&&!all.classList.contains('active'))all.click();
        setTimeout(()=>{setInjuryMode(true);applyInjuryFilter()},0);
      });
    }
    return b;
  }

  function injuredImportedCount(){
    const s=readRepair(),free=Array.isArray(s.freeAgents)?s.freeAgents:[];
    let n=0;
    for(const x of free){
      const p=resolvePlayer(x.name,x.team,x.role);
      if(healthOf(p)?.type==='inj')n++;
    }
    return n;
  }

  function applyInjuryFilter(){
    const chip=ensureInjuryChip();if(!chip)return;
    const on=injuryMode();
    document.querySelectorAll('#repairChips [data-rf]').forEach(x=>x.classList.toggle('active',on?x.dataset.rf==='INJ':x.classList.contains('active')&&x.dataset.rf!=='INJ'));
    chip.classList.toggle('active',on);
    const rows=[...document.querySelectorAll('#repairResults .repair-player')];
    if(!on){rows.forEach(r=>r.style.removeProperty('display'));return}
    let shown=0,available=0;
    rows.forEach(r=>{
      const injured=!!r.querySelector('.tag.inj');
      r.style.display=injured?'':'none';
      if(injured){shown++;if(!r.classList.contains('unavailable'))available++}
    });
    const count=$('repairCount');if(count)count.textContent=`${shown} infortunati mostrati · ${available} disponibili`;
    const total=injuredImportedCount();chip.innerHTML=`🔴 Infortunati${total?` ${total}`:''}`;
  }

  function clearInjuryForOtherFilter(e){
    const b=e.target.closest?.('#repairChips [data-rf]');
    if(b&&b.dataset.rf!=='INJ'){setInjuryMode(false);setTimeout(applyInjuryFilter,0);return}
    const role=e.target.closest?.('[data-role-stat]');
    if(role){setInjuryMode(false);setTimeout(applyInjuryFilter,0)}
  }

  function enhanceModal(){
    const modal=$('repairPlayerModal');if(!modal?.classList.contains('show'))return;
    const p=currentPlayer(),h=healthOf(p),pen=penaltyInfo(p),info=$('repairPlayerInfo');if(!info)return;
    const old=info.innerHTML||'';
    const power=old.replace(/<strong>Condizione:<\/strong>.*?<br>/i,'').trim();
    const desc=profileOf(p),cap=$('repairCap')?.textContent||'—';
    const signal=h?.type==='inj'&&h.sev==='long'?['ROSSO','rischio alto','red']:h?['GIALLO','attenzione','yellow']:['VERDE','nessun problema segnalato','green'];
    const healthHtml=h
      ?`<strong>${h.type==='inj'?'🔴 Infortunato':'🟠 In dubbio'}</strong><br>${esc(h.txt||'Condizioni da monitorare.')}`
      :'<strong class="repair-ok">● Nessun infortunio segnalato</strong>';
    const penHtml=pen.yes?`<strong>🎯 Rigorista</strong><br>${esc(pen.text)}`:'<strong>🎯 Rigori</strong><br>Nessun ruolo da rigorista segnalato.';
    info.className='repair-player-info repair-player-info-v27';
    info.innerHTML=`
      <div class="repair-detail-signal ${signal[2]}">${signal[0]} <span>• ${signal[1]}</span></div>
      <div class="repair-detail-box profile"><strong>⚡ Profilo tecnico</strong><br>${esc(desc)}</div>
      <div class="repair-detail-box health">${healthHtml}</div>
      <div class="repair-detail-box penalties">${penHtml}</div>
      <div class="repair-detail-box strategy"><strong>💰 Strategia riparazione</strong><br>Tetto consigliato: <b>${esc(cap)} cr</b>${power?`<br>${power}`:''}</div>`;
  }

  function bind(){
    ensureInjuryChip();
    document.addEventListener('click',clearInjuryForOtherFilter,true);
    document.addEventListener('click',e=>{if(e.target.closest?.('.repair-player'))setTimeout(enhanceModal,0)});
    $('repairSearch')?.addEventListener('input',()=>setTimeout(applyInjuryFilter,0));
    const results=$('repairResults');if(results)new MutationObserver(()=>requestAnimationFrame(applyInjuryFilter)).observe(results,{childList:true,subtree:true});
    const modal=$('repairPlayerModal');if(modal)new MutationObserver(()=>{if(modal.classList.contains('show'))setTimeout(enhanceModal,0)}).observe(modal,{attributes:true,attributeFilter:['class']});
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 2.7.0';
    setTimeout(applyInjuryFilter,100);setTimeout(applyInjuryFilter,900);setTimeout(applyInjuryFilter,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
