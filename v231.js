/* Fanta Live 2.3.2 — compatta la testata senza perdere i controlli */
(function(){
  'use strict';
  function compactHeader(){
    const controls=document.querySelector('.app-shell-controls');
    const actions=document.querySelector('#auctionPanel .brand-actions')||document.querySelector('.app-shell-brand .brand-actions');
    if(controls&&actions&&actions.parentElement!==controls) controls.appendChild(actions);
  }
  compactHeader();
  requestAnimationFrame(compactHeader);
  setTimeout(compactHeader,250);
})();
