/* Fanta Live 2.8.0 — layout scheda giocatore unificato */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function unifyRepairModal(){
    const modal=$('repairPlayerModal'),sheet=modal?.querySelector('.repair-sheet');
    if(!modal||!sheet)return;
    sheet.classList.add('repair-unified-sheet');

    const buyer=$('repairBuyer')?.closest('label');
    if(buyer)buyer.classList.add('repair-buyer-box');

    const price=$('repairPrice'),priceLabel=price?.closest('label'),buy=$('repairBuyBtn');
    if(price){price.placeholder='Prezzo';price.inputMode='numeric'}
    if(priceLabel){
      priceLabel.classList.add('repair-price-entry');
      for(const n of [...priceLabel.childNodes])if(n.nodeType===3)n.textContent='';
    }
    if(priceLabel&&buy&&!sheet.querySelector('.repair-unified-buy')){
      const row=document.createElement('div');row.className='repair-unified-buy';
      priceLabel.parentNode.insertBefore(row,priceLabel);row.appendChild(priceLabel);row.appendChild(buy);
    }
    const close=$('repairClosePlayer');if(close)close.textContent='Chiudi';
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 2.8.0';
  }

  function onShow(){if($('repairPlayerModal')?.classList.contains('show'))setTimeout(unifyRepairModal,0)}
  function bind(){
    unifyRepairModal();
    const modal=$('repairPlayerModal');if(modal)new MutationObserver(onShow).observe(modal,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target.closest?.('.repair-player'))setTimeout(unifyRepairModal,0)});
    setTimeout(unifyRepairModal,800);setTimeout(unifyRepairModal,2200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
