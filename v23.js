/* Fanta Live 2.3.6 — UI compatta + import Leghe semplificato */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const repairKey='fantaRepairV1';
  const APP_URL='https://garruk929.github.io/Fanta/?v=2.3.6#repair';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const slugify=s=>norm(s).replace(/\s+/g,'-').replace(/^-+|-+$/g,'');
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];

  function readRepair(){try{return JSON.parse(localStorage.getItem(repairKey)||'null')||{teams:[],freeAgents:[],transactions:[]}}catch(e){return{teams:[],freeAgents:[],transactions:[]}}}
  function writeRepair(s){localStorage.setItem(repairKey,JSON.stringify(s))}
  function genericTeam(t,i){const n=norm(t?.name);if(i===0)return !n||n==='la mia squadra'||n==='squadra 1';return !n||n===`squadra ${i+1}`}
  function knownLeague(state=readRepair()){
    const teams=Array.isArray(state.teams)?state.teams:[];
    if(Number(state.leagueSize)>=2)return true;
    if(teams.length<2)return false;
    return !teams.every(genericTeam)||teams.some(t=>(+t.credits||0)>0);
  }
  function leagueCount(state=readRepair()){return knownLeague(state)?(Number(state.leagueSize)||state.teams.length):0}
  function season(){const d=new Date(),y=d.getFullYear(),m=d.getMonth()+1;return m>=7?`${y}/${String(y+1).slice(2)}`:`${y-1}/${String(y).slice(2)}`}

  function syncVersion(){const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 2.3.6'}
  function syncGlobalSub(){
    const sub=$('headerSub');if(!sub)return;
    if(document.body.classList.contains('repair-mode')){
      const n=leagueCount();sub.textContent=`Riparazione${n?` • ${n} squadre`:''} • ${season()}`;
    }else{
      let c={budget:500,teams:8,slots:{P:3,D:8,C:8,A:6}};try{c=JSON.parse(localStorage.getItem('fantaCfgV5')||'null')||c}catch(e){}
      const total=Object.values(c.slots||{}).reduce((a,b)=>a+(+b||0),0);sub.textContent=`${c.teams||8} squadre • ${c.budget||500} crediti • ${total||25} giocatori • ${season()}`;
    }
  }

  function moveSwitchUnderTitle(){
    const nav=document.querySelector('.mode-tabs'),brand=document.querySelector('#auctionPanel .brand-left'),actions=document.querySelector('#auctionPanel .brand-actions');
    if(!nav||!brand)return;
    let shell=document.querySelector('.app-shell-head');
    if(!shell){
      shell=document.createElement('div');shell.className='app-shell-head';
      const row=document.createElement('div');row.className='app-shell-brand';row.appendChild(brand);shell.appendChild(row);
      const controls=document.createElement('div');controls.className='app-shell-controls';controls.appendChild(nav);if(actions)controls.appendChild(actions);shell.appendChild(controls);
      document.body.insertBefore(shell,document.body.firstChild);
    }else{
      let controls=shell.querySelector('.app-shell-controls');if(!controls){controls=document.createElement('div');controls.className='app-shell-controls';shell.appendChild(controls)}
      if(nav.parentElement!==controls)controls.appendChild(nav);if(actions&&actions.parentElement!==controls)controls.appendChild(actions);
    }
    nav.querySelectorAll('.mode-tab').forEach(b=>{if(!b.dataset.shellBound){b.dataset.shellBound='1';b.addEventListener('click',()=>setTimeout(syncGlobalSub,0))}});
    syncGlobalSub();
  }

  function syncRepairTeamsUI(){
    const state=readRepair(),ready=knownLeague(state),n=leagueCount(state);document.body.classList.toggle('repair-teams-ready',ready);
    if(ready&&Number(state.leagueSize)!==n){state.leagueSize=n;writeRepair(state)}
    if(!ready){
      if($('repairMyCredits'))$('repairMyCredits').textContent='—';
      if($('repairRank'))$('repairRank').textContent='Imposta numero squadre';
      if($('repairSummary'))$('repairSummary').innerHTML='<strong>Prima configura la lega.</strong> Inserisci il nome della lega o importala da Leghe Fantacalcio; squadre e crediti compariranno solo dopo.';
    }
    syncGlobalSub();
  }

  function setupLeagueSizeBox(){
    const editor=$('repairTeamsEditor');if(!editor||$('leagueSizeBox'))return;
    const box=document.createElement('div');box.className='league-size-box';box.id='leagueSizeBox';
    box.innerHTML='<label><span>Numero squadre della lega</span><input id="leagueSizeInput" type="number" inputmode="numeric" min="2" max="30" placeholder="es. 8"></label><button id="applyLeagueSize">Crea / aggiorna squadre</button><div class="league-size-hint">Usalo solo se non vuoi importare automaticamente la lega.</div>';
    editor.parentNode.insertBefore(box,editor);
    $('applyLeagueSize').onclick=()=>{
      const raw=Math.round(Number($('leagueSizeInput').value));if(!Number.isFinite(raw)||raw<2)return alert('Inserisci il numero di squadre della lega.');const n=Math.min(30,raw);
      const state=readRepair(),old=Array.isArray(state.teams)?state.teams:[];
      state.leagueSize=n;state.teams=Array.from({length:n},(_,i)=>old[i]?{...old[i],id:old[i].id||`t${i+1}`}:{id:`t${i+1}`,name:i===0?'La mia squadra':`Squadra ${i+1}`,credits:0,mine:i===0});
      if(!state.teams.some(t=>t.mine)&&state.teams[0])state.teams[0].mine=true;
      writeRepair(state);localStorage.setItem('fantaModeV2','repair');location.reload();
    };
  }
  function syncSetupModal(){
    setupLeagueSizeBox();const modal=$('repairSetupModal'),state=readRepair(),ready=knownLeague(state),n=leagueCount(state);if(!modal)return;
    modal.querySelector('.setup-sheet')?.classList.toggle('setup-unconfigured',!ready);const input=$('leagueSizeInput');if(input)input.value=ready?n:'';
  }

  async function jina(url){
    const clean=String(url).replace(/^https?:\/\//,'');
    const r=await fetch('https://r.jina.ai/http://'+clean,{cache:'no-store'});
    if(!r.ok)throw new Error('Pagina non leggibile (HTTP '+r.status+').');
    return await r.text();
  }

  function sourceCandidates(input){
    const raw=String(input||'').trim();if(!raw)throw new Error('Scrivi il nome della tua lega oppure incolla un qualsiasi link della lega.');
    const slugs=[],exact=[];let query=raw;
    const addSlug=s=>{s=slugify(s);if(s&&s.length>1&&!slugs.includes(s))slugs.push(s)};
    const routeWords=new Set(['app','lega','league','home','dashboard','live','squadre','rose','mercato','market','players','player','statistiche','competizioni','classifica','info','info-squadra','area-gioco','inserisci-formazione','formazioni','calendario','regole','admin']);
    try{
      let maybe=raw;if(!/^https?:\/\//i.test(maybe)&&/leghe\.fantacalcio\.it/i.test(maybe))maybe='https://'+maybe;
      const u=new URL(maybe);
      if(/(^|\.)leghe\.fantacalcio\.it$/i.test(u.hostname)){
        exact.push(u.href);query='';
        const parts=[...u.pathname.split('/'),...u.hash.replace(/^#/,'').split('/')].map(x=>decodeURIComponent(x||'').trim()).filter(Boolean);
        for(const p of parts){const s=slugify(p);if(s&&!routeWords.has(s)&&!/^\d+$/.test(s))addSlug(s)}
        for(const [k,v] of u.searchParams){if(/lega|league|slug|name/i.test(k))addSlug(v)}
      }
    }catch(e){}
    if(!slugs.length){
      query=raw;const s=slugify(raw);addSlug(s);addSlug(s.replace(/-/g,''));
      if(s.startsWith('lega-'))addSlug(s.slice(5));else addSlug('lega-'+s);
    }
    return {raw,query:query||slugs[0]||raw,slugs:uniq(slugs),exact:uniq(exact)};
  }

  async function discoverSlugs(query){
    const q=String(query||'').trim();if(!q)return [];
    const out=[];
    const addFrom=text=>{for(const m of String(text||'').matchAll(/leghe\.fantacalcio\.it\/([a-z0-9-]{2,})/gi)){const s=slugify(m[1]);if(s&&!out.includes(s))out.push(s)}};
    const search=`site:leghe.fantacalcio.it ${q} \"Budget disponibile\"`;
    const urls=[
      'https://www.google.com/search?q='+encodeURIComponent(search),
      'https://www.bing.com/search?q='+encodeURIComponent(search)
    ];
    for(const u of urls){try{addFrom(await jina(u));if(out.length)break}catch(e){}}
    return out;
  }

  function parseTeamsText(text){
    text=String(text||'');const budgets=[...text.matchAll(/(\d+)\s+Budget disponibile/gi)].map(m=>Number(m[1]));if(!budgets.length)return [];
    const names=[];
    const exact=/Divisione\s+[^\n#]+\n+#{3,6}\s*([^\n#]+)\n/gi;let m;
    while((m=exact.exec(text))){const n=String(m[1]||'').trim();if(n&&!/^(per l'admin|strumenti squadra|il gioco)/i.test(n)&&!names.some(x=>norm(x)===norm(n)))names.push(n)}
    if(names.length<budgets.length){
      const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      for(let i=0;i<lines.length&&names.length<budgets.length;i++){
        if(!/^\d+\s+Budget disponibile/i.test(lines[i]))continue;
        let candidate='';
        for(let j=i-1;j>=0&&j>=i-8;j--){
          const h=lines[j].match(/^#{3,6}\s*(.+)$/);if(h&&h[1]&&!/^(per l'admin|strumenti|squadre|il gioco)/i.test(h[1])){candidate=h[1].trim();break}
        }
        if(candidate&&!names.some(x=>norm(x)===norm(candidate)))names.push(candidate);
      }
    }
    const n=Math.min(names.length,budgets.length),out=[];for(let i=0;i<n;i++)out.push({name:names[i],credits:budgets[i]});
    return out.filter((t,i,a)=>norm(t.name)&&a.findIndex(x=>norm(x.name)===norm(t.name))===i);
  }

  function playersVisibleInText(text){
    const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[],hay=' '+norm(text)+' ';
    return live.filter(p=>{const n=norm(p.name);return n.length>=4&&hay.includes(' '+n+' ')})
  }
  function saveTeams(teams,source){
    const state=readRepair(),oldMine=state.teams?.find(t=>t.mine)?.name||'';
    state.teams=teams.map((t,i)=>({id:'pub'+(i+1),name:t.name,credits:Math.max(0,Math.round(+t.credits||0)),mine:oldMine?norm(t.name)===norm(oldMine):i===0}));
    if(!state.teams.some(t=>t.mine)&&state.teams[0])state.teams[0].mine=true;
    state.leagueSize=teams.length;state.sourceName=source;state.version=5;writeRepair(state);localStorage.setItem('fantaModeV2','repair');
  }
  function saveFree(players,source){
    if(!players?.length)return;const state=readRepair(),map=new Map();for(const p of players){if(p?.name&&p?.role)map.set(`${norm(p.name)}|${p.role}`,{...p})}
    state.freeAgents=[...map.values()];state.sourceName=source||state.sourceName;state.transactions=[];state.version=5;writeRepair(state);
  }

  async function trySlug(slug,exact,status){
    const base='https://leghe.fantacalcio.it/'+slug;
    const urls=uniq([...(exact||[]),base+'/squadre?all=true',base+'/squadre',base]);
    for(const url of urls){
      try{status.textContent=`Cerco ${slug}…`;const txt=await jina(url),teams=parseTeamsText(txt);if(teams.length>=2)return {slug,base,teams,url}}catch(e){}
    }
    return null;
  }

  async function importLeague(){
    const input=$('legheUrl'),status=$('legheImportStatus');let raw=String(input?.value||'').trim();
    if(!raw){
      try{raw=String(await navigator.clipboard.readText()).trim();if(input)input.value=raw}catch(e){}
    }
    const src=sourceCandidates(raw),slugs=[...src.slugs];
    let found=null;
    for(const s of slugs){found=await trySlug(s,src.exact,status);if(found)break}
    if(!found){
      status.textContent='Non basta il link: provo a trovare la lega dal nome…';
      const discovered=await discoverSlugs(src.query);
      for(const s of discovered){if(slugs.includes(s))continue;found=await trySlug(s,[],status);if(found)break}
    }
    if(!found)throw new Error('Non riesco a leggere pubblicamente questa lega. Prova scrivendo solo il nome esatto della lega; se la lega è privata usa il file/JSON come fallback.');

    saveTeams(found.teams,'Leghe · '+found.slug+' · automatico');
    let free=[];
    try{
      status.textContent=`✓ ${found.teams.length} squadre e crediti. Ricavo gli svincolati dalle rose…`;
      const roseText=await jina(found.base+'/rose');const owned=playersVisibleInText(roseText);
      const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[];
      if(owned.length>=Math.max(10,found.teams.length*8)){
        const ownedNames=new Set(owned.map(p=>norm(p.name)));free=live.filter(p=>!ownedNames.has(norm(p.name)));if(free.length)saveFree(free,'Leghe · '+found.slug+' · rose');
      }
    }catch(e){}
    if(!free.length){
      try{status.textContent=`✓ ${found.teams.length} squadre e crediti. Cerco gli svincolati…`;const txt=await jina(found.base+'/market/players?releaseds=');free=playersVisibleInText(txt);if(free.length>=20)saveFree(free,'Leghe · '+found.slug+' · mercato')}catch(e){}
    }
    status.textContent=`✓ Fatto: ${found.teams.length} squadre con crediti${free.length?` · ${free.length} svincolati`:''}.`;
    setTimeout(()=>location.replace(APP_URL),650);
  }

  function addLegheLinkHelp(){
    const sheet=document.querySelector('.leghe-import-sheet');if(!sheet||sheet.querySelector('.leghe-link-help'))return;
    const label=$('legheUrl')?.closest('label');if(!label)return;
    const help=document.createElement('div');help.className='leghe-link-help';
    help.innerHTML='<b>Metodo consigliato:</b> scrivi semplicemente il <b>nome esatto della lega</b> (es. <code>MagicCup</code>). Fanta Live prova automaticamente il nome web corretto e cerca squadre, crediti e rose. In alternativa puoi incollare qualunque link che hai mentre sei dentro la lega: non serve che finisca con <code>/squadre</code>.';
    label.insertAdjacentElement('afterend',help);
  }

  function upgradeLegheImporter(){
    const modal=$('legheImportModal'),input=$('legheUrl'),button=$('importLegheUrl');if(!modal||!input||!button)return;
    modal.dataset.easyImport='236';input.type='text';input.inputMode='text';input.placeholder='Nome della lega (es. MagicCup)';
    const label=input.closest('label');if(label&&label.firstChild)label.firstChild.textContent='Nome lega o qualsiasi link';
    button.textContent='🔎 Trova e importa';button.onclick=()=>importLeague().catch(e=>{const s=$('legheImportStatus');if(s)s.textContent='Errore: '+e.message});
    const intro=modal.querySelector('.repair-help');if(intro)intro.textContent='Scrivi solo il nome della tua lega: è il metodo più semplice. Fanta Live prova da solo le pagine corrette. Puoi anche incollare qualsiasi link della lega; non serve cercare /squadre.';
    const divider=modal.querySelector('.leghe-divider'),steps=modal.querySelector('.leghe-steps'),copy=$('copyLegheCapture'),paste=$('pasteLegheData');
    [divider,steps,copy,paste].forEach(el=>{if(el)el.style.display='none'});
    const open=$('openLegheSite');if(open){open.textContent='Apri Leghe Fantacalcio ↗';open.title='Apri il sito solo se devi controllare il nome esatto della lega'}
    const file=$('legheFileFallback');if(file)file.textContent='📄 Fallback: importa file / JSON';
    addLegheLinkHelp();
  }

  function watch(){
    const strip=$('repairPowerStrip');if(strip)new MutationObserver(()=>requestAnimationFrame(syncRepairTeamsUI)).observe(strip,{childList:true});
    ['repairSetupBtn','repairSettingsBtn'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(syncSetupModal,0)));
    const importBtn=$('importCreditsBtn');if(importBtn)importBtn.addEventListener('click',()=>setTimeout(upgradeLegheImporter,0));
    document.addEventListener('click',e=>{if(e.target?.id==='importCreditsBtn')setTimeout(upgradeLegheImporter,0)});
    setTimeout(()=>{syncRepairTeamsUI();syncSetupModal();upgradeLegheImporter();syncVersion();moveSwitchUnderTitle()},250);
    setTimeout(()=>{syncRepairTeamsUI();upgradeLegheImporter()},1200);
  }

  moveSwitchUnderTitle();watch();syncVersion();
})();