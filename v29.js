/* Fanta Live 2.9.0 — undo Riparazione + pulizia strategia duplicata */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const REPAIR_KEY='fantaRepairV1';

  function readRepair(){
    try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{teams:[],transactions:[]}}
    catch(e){return{teams:[],transactions:[]}}
  }

  function strategyBlocks(){
    const modal=$('repairPlayerModal');if(!modal)return[];
    const anchors=[...modal.querySelectorAll('strong,b')].filter(el=>/strategia\s+riparazione/i.test(el.textContent||''));
    const found=[];
    for(const a of anchors){
      let n=a.parentElement,best=null;
      while(n&&n!==modal){
        const cls=String(n.className||'');
        const txt=String(n.textContent||'').trim();
        if(txt.length<700&&(/strategy|strategia|detail-box|\bbox\b/i.test(cls)))best=n;
        if(/repair-player-info-v27/.test(cls))break;
        n=n.parentElement;
      }
      const block=best||a.parentElement;if(block&&!found.includes(block))found.push(block);
    }
    return found;
  }

  function cleanupRepairStrategy(){
    const blocks=strategyBlocks();if(blocks.length<2)return;
    const keep=blocks.find(x=>/potere\s+d['’]acquisto/i.test(x.textContent||''))||blocks[blocks.length-1];
    for(const b of blocks)if(b!==keep)b.remove();
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
    const controls=document.querySelector('.app-shell-controls');if(!controls)return;
    let box=controls.querySelector('.repair-top-actions');
    if(!box){
      box=document.createElement('div');box.className='repair-top-actions';
      box.innerHTML='<button class="icon repair-undo-top" type="button" title="Annulla ultimo movimento riparazione" aria-label="Annulla ultimo movimento riparazione">↶</button>';
      controls.appendChild(box);
      box.querySelector('button').addEventListener('click',undoLatestRepair);
    }
    syncUndoState();
  }

  function syncUndoState(){
    const b=document.querySelector('.repair-undo-top');if(!b)return;
    b.disabled=!hasUndo();b.setAttribute('aria-disabled',String(b.disabled));
  }

  function polishImporterCopy(){
    const b=$('importDirectLeagueBtn')||$('importLeagueBtn')||$('importCreditsBtn');
    if(b){b.textContent='🔐 Importa Lega';b.title='Apri qualsiasi pagina della tua lega: non serve /squadre';}
    const note=document.querySelector('.repair-source-note');
    if(note)note.textContent='Importa Lega funziona da qualsiasi pagina della tua lega già aperta in Safari o Chrome: non serve trovare /squadre né copiare un URL specifico.';
  }

  function bind(){
    ensureRepairUndo();cleanupRepairStrategy();polishImporterCopy();
    const modal=$('repairPlayerModal');if(modal)new MutationObserver(()=>{if(modal.classList.contains('show'))setTimeout(cleanupRepairStrategy,0)}).observe(modal,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
    const tx=$('repairTransactions');if(tx)new MutationObserver(syncUndoState).observe(tx,{childList:true,subtree:true});
    new MutationObserver(()=>{ensureRepairUndo();polishImporterCopy()}).observe(document.body,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target.closest?.('.repair-player'))setTimeout(cleanupRepairStrategy,25)});
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 2.9.0';
    setTimeout(()=>{ensureRepairUndo();cleanupRepairStrategy();polishImporterCopy()},700);
    setTimeout(()=>{ensureRepairUndo();cleanupRepairStrategy();polishImporterCopy()},2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();