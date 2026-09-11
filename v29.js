/* Fanta Live 3.0.0 — Liquid Glass + pulizia strategia + import Leghe diretto */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const REPAIR_KEY='fantaRepairV1';

  function readRepair(){
    try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{teams:[],transactions:[]}}
    catch(e){return{teams:[],transactions:[]}}
  }

  function cleanupRepairStrategy(){
    const modal=$('repairPlayerModal');if(!modal)return;
    const info=$('repairPlayerInfo');
    const keep=info?.querySelector('.repair-detail-box.strategy')||null;

    /* La strategia completa resta solo nel riquadro inferiore creato da v27. */
    if(keep){
      modal.querySelectorAll('.repair-detail-box.strategy').forEach(el=>{if(el!==keep)el.remove()});
      const anchors=[...modal.querySelectorAll('strong,b')].filter(el=>/strategia\s+riparazione/i.test(el.textContent||''));
      for(const a of anchors){
        if(keep.contains(a))continue;
        const block=a.closest('.repair-detail-box,.repair-player-strategy,.repair-strategy,.strategy,.box')||a.parentElement;
        if(block&&!keep.contains(block))block.remove();
      }
    }

    /* Il tetto consigliato è già riportato nella strategia inferiore: niente doppione in testata. */
    const cap=modal.querySelector('.repair-cap');
    if(cap)cap.style.display='none';
  }

  function hasUndo(){
    const s=readRepair();return Array.isArray(s.transactions)&&s.transactions.length>0;
  }

  function undoLatestRepair(){
    const domUndo=document.querySelector('#repairTransactions [data-tx]');
    if(domUndo){domUndo.click();setTimeout(syncUndoState,30);return}
    const s=readRepair(),tx=Array.isArray(s.transactions)?s.transactions[s.transactions.length-1]:null;
    if(!tx)return;
    const team=Array.isArray(s.teams)?s.teams.find(t=>String(t.id)===String(tx.teamId)):null;
    if(team)team.credits=(+team.credits||0)+(+tx.price||0);
    s.transactions.pop();localStorage.setItem(REPAIR_KEY,JSON.stringify(s));location.reload();
  }

  function ensureRepairUndo(){
    document.querySelectorAll('.app-shell-controls .repair-top-actions').forEach(el=>el.remove());

    const brand=document.querySelector('.repair-brand'),gear=$('repairSettingsBtn');
    if(!brand||!gear)return;

    let box=brand.querySelector('.repair-brand-actions');
    if(!box){
      box=document.createElement('div');
      box.className='repair-brand-actions';
      brand.appendChild(box);
    }

    let undo=box.querySelector('.repair-undo-top');
    if(!undo){
      undo=document.createElement('button');
      undo.className='repair-gear repair-undo-top';
      undo.type='button';
      undo.title='Annulla ultimo movimento riparazione';
      undo.setAttribute('aria-label','Annulla ultimo movimento riparazione');
      undo.textContent='↶';
      undo.addEventListener('click',undoLatestRepair);
    }

    if(undo.parentElement!==box)box.appendChild(undo);
    if(gear.parentElement!==box)box.appendChild(gear);
    if(box.firstElementChild!==undo)box.insertBefore(undo,gear);
    syncUndoState();
  }

  function syncUndoState(){
    const b=document.querySelector('.repair-undo-top');if(!b)return;
    b.disabled=!hasUndo();b.setAttribute('aria-disabled',String(b.disabled));
  }

  function polishImporterCopy(){
    const b=$('importDirectLeagueBtn')||$('importLeagueBtn')||$('importCreditsBtn');
    if(b){
      b.textContent='🔐 Importa Lega';
      b.title='Importa direttamente dalla sessione Leghe: non serve alcun link /squadre';
    }
    const note=document.querySelector('.repair-source-note');
    if(note)note.textContent='Importa Lega funziona da qualsiasi schermata della tua lega già aperta in Safari o Chrome: non serve trovare /squadre né copiare un URL specifico.';

    const modal=$('directLegheModal');
    if(modal){
      const h=modal.querySelector('.leghe-import-head h3');if(h)h.textContent='Importa direttamente dalla lega';
      const p=modal.querySelector('.repair-help');if(p)p.innerHTML='Non devi cercare nessun link particolare. Configura una sola volta <b>Fanta Live Import</b>, poi apri <b>qualsiasi schermata</b> della tua lega e tocca il preferito: Fanta Live importa automaticamente squadre, crediti, rose e svincolati.';
      const st=$('directStatus');if(st&&!/copiato|errore/i.test(st.textContent||''))st.textContent='Nessun /squadre richiesto: va bene qualunque pagina della lega aperta e autenticata.';
    }
  }

  function bind(){
    ensureRepairUndo();cleanupRepairStrategy();polishImporterCopy();
    const modal=$('repairPlayerModal');if(modal)new MutationObserver(()=>{if(modal.classList.contains('show'))setTimeout(cleanupRepairStrategy,0)}).observe(modal,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
    const tx=$('repairTransactions');if(tx)new MutationObserver(syncUndoState).observe(tx,{childList:true,subtree:true});
    new MutationObserver(()=>{ensureRepairUndo();polishImporterCopy()}).observe(document.body,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{
      if(e.target.closest?.('.repair-player'))setTimeout(cleanupRepairStrategy,25);
      if(e.target.closest?.('#importDirectLeagueBtn,#importLeagueBtn,#importCreditsBtn'))setTimeout(polishImporterCopy,40);
    });
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 3.0.0 · Liquid Glass';
    setTimeout(()=>{ensureRepairUndo();cleanupRepairStrategy();polishImporterCopy()},700);
    setTimeout(()=>{ensureRepairUndo();cleanupRepairStrategy();polishImporterCopy()},2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();