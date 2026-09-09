/* Fanta Live 2.4 — bootstrap UI, filtri ruolo e import Leghe privato */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);

  function syncAuctionRoles(){
    const box=$('roles');if(!box)return;
    const active=document.querySelector('.chips .chip.active[data-f]'),f=active?.dataset.f||'ALL',isRole=/^[PDCA]$/.test(f);
    box.classList.toggle('role-filtering',isRole);
    box.querySelectorAll('.role').forEach(card=>{
      const r=['P','D','C','A'].find(x=>card.classList.contains(x.toLowerCase()));if(!r)return;
      card.classList.toggle('filter-active',isRole&&r===f);card.setAttribute('role','button');card.setAttribute('tabindex','0');
      const go=()=>document.querySelector(`.chips .chip[data-f="${isRole&&r===f?'ALL':r}"]`)?.click();
      card.onclick=go;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}};
    });
  }
  function setupRoleSync(){
    const box=$('roles');if(!box)return;
    new MutationObserver(syncAuctionRoles).observe(box,{childList:true,subtree:true});
    document.querySelector('.chips')?.addEventListener('click',()=>setTimeout(syncAuctionRoles,0));
    syncAuctionRoles();
  }
  function loadStyle(href,key){if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)}
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.dataset[key]='1';document.body.appendChild(s)}

  setupRoleSync();
  loadStyle('v23.css?v=2.3.6','fantaV23');
  loadScript('v23.js?v=2.3.6','fantaV23');
  loadStyle('v24.css?v=2.4.0','fantaV24');
  loadScript('v24.js?v=2.4.0','fantaV24');
})();