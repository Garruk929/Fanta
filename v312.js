/* Fanta Live 3.1.2 — fix filtro Miei + coerenza filtri */
(function(){
  'use strict';
  const MINE_FILTER_KEY='fantaRepairMineFilterV31';
  const $=id=>document.getElementById(id);

  function mineChip(){return document.querySelector('#repairChips [data-v31="MINE"]')}
  function clearMineVisual(){
    localStorage.setItem(MINE_FILTER_KEY,'0');
    mineChip()?.classList.remove('active');
  }

  function bindExclusiveRepairFilters(){
    document.addEventListener('click',e=>{
      const normal=e.target.closest?.('#repairChips [data-rf]');
      if(normal){
        clearMineVisual();
        return;
      }
      const role=e.target.closest?.('#repairRoleStats [data-role-stat]');
      if(role){
        clearMineVisual();
        return;
      }
      if(e.target.closest?.('#auctionTab')) clearMineVisual();
    },true);

    const chips=$('repairChips');
    if(chips){
      new MutationObserver(()=>{
        if(localStorage.getItem(MINE_FILTER_KEY)!=='1')mineChip()?.classList.remove('active');
      }).observe(chips,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
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
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 3.1.2 · Liquid Glass';
    setTimeout(polishImportCopy,700);setTimeout(polishImportCopy,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
