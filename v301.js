/* Fanta Live 3.0.1 — import Leghe semplificato + filtri ruolo puliti */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function polishImport(){
    const b=$('importDirectLeagueBtn')||$('importLeagueBtn')||$('importCreditsBtn');
    if(b){
      b.textContent='🔐 Importa Lega';
      b.title='Apri una qualunque pagina della tua lega: non serve /squadre né un URL speciale';
    }
    const note=document.querySelector('.repair-source-note');
    if(note)note.textContent='Importa Lega: apri una qualunque pagina della tua lega già autenticata in Safari o Chrome e usa Fanta Live Import. Non serve trovare /squadre né copiare link particolari.';

    const modal=$('directLegheModal');
    if(modal){
      const h=modal.querySelector('.leghe-import-head h3');if(h)h.textContent='Importa la lega da qualsiasi pagina';
      const p=modal.querySelector('.repair-help');if(p)p.innerHTML='Configura una sola volta <b>Fanta Live Import</b>. Poi apri <b>qualsiasi pagina della tua lega</b> già autenticata e tocca il preferito: Fanta Live recupera automaticamente squadre, crediti, rose e svincolati.';
      const st=$('directStatus');if(st&&!/copiato|errore/i.test(st.textContent||''))st.textContent='Non serve /squadre: va bene la home della lega, mercato, formazione o qualunque altra pagina della stessa lega.';
    }
  }

  /* In Riparazione, toccando di nuovo la card ruolo attiva si torna a “Tutti”. */
  document.addEventListener('click',e=>{
    const role=e.target.closest?.('[data-role-stat]');
    if(role&&role.classList.contains('active')){
      e.preventDefault();e.stopImmediatePropagation();
      document.querySelector('#repairChips [data-rf="ALL"]')?.click();
    }
  },true);

  function bind(){
    polishImport();
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 3.0.1 · Liquid Glass';
    document.addEventListener('click',e=>{if(e.target.closest?.('#importDirectLeagueBtn,#importLeagueBtn,#importCreditsBtn'))setTimeout(polishImport,40)});
    setTimeout(polishImport,700);setTimeout(polishImport,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
