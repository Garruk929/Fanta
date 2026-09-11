/* Fanta Live 3.1.6 — fix definitivo stabilità touch + coerenza filtri */
(function(){
  'use strict';
  const MINE_FILTER_KEY='fantaRepairMineFilterV31';
  const $=id=>document.getElementById(id);

  function mineChip(){return document.querySelector('#repairChips [data-v31="MINE"]')}
  function clearMineVisual(){
    localStorage.setItem(MINE_FILTER_KEY,'0');
    const chip=mineChip();
    if(chip&&chip.classList.contains('active'))chip.classList.remove('active');
  }

  /*
    IMPORTANTE: niente MutationObserver sulle classi dei filtri.
    Su iOS il render della riparazione cambia spesso le classi active; osservare le
    stesse classi e modificarle di nuovo dal callback può creare un loop di microtask
    che blocca il main thread e fa sembrare morto tutto il touch.
    La sincronizzazione viene fatta solo in risposta a click reali dell'utente.
  */
  function bindExclusiveRepairFilters(){
    if(document.documentElement.dataset.v313FilterBound==='1')return;
    document.documentElement.dataset.v313FilterBound='1';

    document.addEventListener('click',e=>{
      const target=e.target;
      if(!target?.closest)return;
      const normal=target.closest('#repairChips [data-rf]');
      const role=target.closest('#repairRoleStats [data-role-stat]');
      const auction=target.closest('#auctionTab');
      if(normal||role||auction)clearMineVisual();
    },false);
  }

  function polishImportCopy(){
    const b=$('importDirectLeagueBtn')||$('importLeagueBtn')||$('importCreditsBtn');
    if(b){
      b.textContent='🔐 Importa Lega';
      b.title='Funziona da qualunque pagina della tua lega: non serve /squadre';
    }
    const modal=$('directLegheModal');
    if(modal){
      const h=modal.querySelector('.leghe-import-head h3');if(h)h.textContent='Importa la lega da qualsiasi pagina';
      const p=modal.querySelector('.repair-help');if(p)p.innerHTML='Non serve trovare <b>/squadre</b> né copiare link speciali. Apri <b>qualsiasi pagina della tua lega</b> già autenticata nello stesso browser e avvia <b>Fanta Live Import</b>.';
      const st=$('directStatus');if(st&&!/copiato|errore/i.test(st.textContent||''))st.textContent='Va bene home lega, mercato, classifica, formazione o qualsiasi altra schermata della stessa lega.';
    }
  }

  function bind(){
    bindExclusiveRepairFilters();
    polishImportCopy();
    document.addEventListener('click',e=>{if(e.target.closest?.('#importDirectLeagueBtn,#importLeagueBtn,#importCreditsBtn'))setTimeout(polishImportCopy,40)});
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 3.1.6 · Liquid Glass';
    setTimeout(polishImportCopy,700);setTimeout(polishImportCopy,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
