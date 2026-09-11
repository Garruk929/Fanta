/* Fanta Live 3.0.1 — bootstrap UI, import Leghe diretto e schede coerenti */
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
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='1';document.body.appendChild(s)}
  function syncCopy(){
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 3.0.1 · Liquid Glass';
    const note=document.querySelector('.repair-source-note');if(note)note.textContent='Da iPhone: usa “Importa Lega”. Non devi trovare /squadre né copiare un link specifico: Fanta Live Import funziona da qualsiasi pagina della lega aperta in Safari o Chrome.';
  }

  setupRoleSync();
  loadStyle('v23.css?v=2.3.6','fantaV23');
  loadScript('v23.js?v=2.3.6','fantaV23');
  loadStyle('v24.css?v=2.6.0','fantaV24');
  loadStyle('v25.css?v=2.6.0','fantaV25');
  loadStyle('v26.css?v=2.6.0','fantaV26');
  loadScript('v26.js?v=2.6.0','fantaV26');
  loadStyle('v27.css?v=2.7.0','fantaV27');
  loadScript('v27.js?v=2.7.0','fantaV27');
  loadStyle('v28.css?v=2.8.0','fantaV28');
  loadScript('v28.js?v=2.8.0','fantaV28');
  loadStyle('v29.css?v=3.0.0','fantaV29');
  loadScript('v29.js?v=3.0.0','fantaV29');
  loadStyle('v301.css?v=3.0.1','fantaV301');
  loadScript('v301.js?v=3.0.1','fantaV301');
  syncCopy();setTimeout(syncCopy,900);setTimeout(syncCopy,2600);
})();