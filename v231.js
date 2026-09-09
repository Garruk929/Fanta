/* Fanta Live 2.3.1 — compatta la testata senza perdere i controlli */
(function(){
  'use strict';
  function compactHeader(){
    const shellBrand=document.querySelector('.app-shell-brand');
    const actions=document.querySelector('#auctionPanel .brand-actions');
    if(shellBrand&&actions&&actions.parentElement!==shellBrand) shellBrand.appendChild(actions);
  }
  compactHeader();
  requestAnimationFrame(compactHeader);
  setTimeout(compactHeader,250);
})();
