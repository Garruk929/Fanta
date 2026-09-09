/* Fanta Live 2.6.0 — import diretto Leghe da Safari/Chrome */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const REPAIR_KEY='fantaRepairV1';
  const APP='https://garruk929.github.io/Fanta/?v=2.6.0';
  const APP_KEY='ICiELOObd5DF5uJEATi77CRvHiiRuMU0';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const read=()=>{try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{teams:[],freeAgents:[],transactions:[]}}catch(e){return{teams:[],freeAgents:[],transactions:[]}}};
  const write=s=>localStorage.setItem(REPAIR_KEY,JSON.stringify(s));

  function decode64url(s){
    s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');
    s+='='.repeat((4-s.length%4)%4);
    const bin=atob(s),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function makeBookmarklet(){
    const code=`(async()=>{try{
      const APP='${APP}',KEY='${APP_KEY}';
      if(!/(^|\\.)leghe\\.fantacalcio\\.it$/i.test(location.hostname))throw Error('Apri Leghe Fantacalcio in questo browser e fai login.');
      const dec=t=>{try{let p=String(t).split('.')[1].replace(/-/g,'+').replace(/_/g,'/');p+='='.repeat((4-p.length%4)%4);return JSON.parse(atob(p))}catch(e){return{}}};
      const jwt=o=>{if(!o||typeof o!=='object')return'';for(const k of ['token','leagueToken','league_token','accessToken','access_token','jwt'])if(typeof o[k]==='string'&&o[k].split('.').length===3)return o[k];for(const v of Object.values(o))if(typeof v==='string'&&v.startsWith('eyJ')&&v.split('.').length===3)return v;return''};
      const leagues=[],seen=new Set();let preferred=null;
      const add=(x,pref)=>{if(!x||typeof x!=='object')return;const t=jwt(x),id=String(x.id??x.leagueId??x.l_id??''),a=String(x.alias??x.slug??'');if(!t&&!id&&!a)return;const k=id+'|'+a+'|'+t.slice(-12);if(seen.has(k))return;seen.add(k);leagues.push(x);if(pref)preferred=x};
      const inspect=root=>{if(!root||typeof root!=='object')return;if(Array.isArray(root.leagues))root.leagues.forEach(x=>add(x,false));if(root.currentLeague)add(root.currentLeague,true);for(const [k,v] of Object.entries(root)){if(/^current-user-/i.test(k)&&v&&typeof v==='object'){if(Array.isArray(v.leagues))v.leagues.forEach(x=>add(x,false));if(v.currentLeague)add(v.currentLeague,true)}}};
      for(const store of [localStorage,sessionStorage])for(let i=0;i<store.length;i++){try{inspect(JSON.parse(store.getItem(store.key(i))))}catch(e){}};
      if(!leagues.length)throw Error('Sessione Leghe non trovata. Esci e rientra su Leghe nello stesso browser, poi riprova.');
      const path=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
      let league=leagues.find(x=>String(x.alias||x.slug||'').toLowerCase()===path);
      if(!league&&preferred){const pid=String(preferred.id??preferred.leagueId??'');league=leagues.find(x=>String(x.id??x.leagueId??'')===pid)||preferred}
      if(!league&&leagues.length===1)league=leagues[0];
      if(!league){const labels=leagues.map((x,i)=>(i+1)+'. '+(x.name||x.alias||x.slug||x.id||('Lega '+(i+1))));const p=prompt('Scegli la lega da importare:\\n'+labels.join('\\n'),'1');if(p===null)return;league=leagues[Math.max(0,Math.min(leagues.length-1,(parseInt(p,10)||1)-1))]}
      const token=jwt(league);if(!token)throw Error('Token della lega non trovato. Apri la lega dopo il login e riprova.');
      const claims=dec(token),myTeam=+(claims.t_id||claims.team_id||0)||0;
      const H={'app_key':KEY,'Authorization':'Bearer '+token};
      const get=async p=>{const r=await fetch('https://apileague.fantacalcio.it'+p,{headers:H,cache:'no-store'});if(!r.ok)throw Error('API Leghe '+r.status);return r.json()};
      let teams=[];
      for(const tp of ['/onboarding/v1/league/teams?page=1&pageSize=50&division=A','/onboarding/v1/league/teams?page=1&pageSize=50']){try{const b=await get(tp),rows=Array.isArray(b.data)?b.data:(Array.isArray(b.teams)?b.teams:[]);if(rows.length){teams=rows;break}}catch(e){}}
      if(!teams.length)throw Error('Non riesco a leggere le squadre. Riapri una pagina della tua lega e riprova.');
      let pool=[];try{const b=await get('/onboarding/v1/league/players');pool=Array.isArray(b.players)?b.players:(Array.isArray(b.data)?b.data:[])}catch(e){}
      const owned=new Set();
      const ct=teams.map((t,i)=>{const ids=String(t.cal||t.players||'').split(';').filter(Boolean),costs=String(t.cs||'').split(';').filter(Boolean);ids.forEach(id=>owned.add(String(id)));return{i:t.id??('t'+(i+1)),n:String(t.n||t.name||('Squadra '+(i+1))),c:+(t.cr??t.credits??0)||0,ci:+(t.cri??0)||0,cs:+(t.crs??0)||0,r:ids.map((id,j)=>[id,+costs[j]||0])}});
      const free=pool.filter(p=>!owned.has(String(p.id))).map(p=>({i:p.id,n:String(p.name||p.n||''),s:String(p.stnme||p.team||'')}));
      const payload={fl:26,lid:league.id??league.leagueId??null,ln:String(league.name||league.alias||'Lega'),mt:myTeam,t:ct,f:free,ts:Date.now()};
      const bytes=new TextEncoder().encode(JSON.stringify(payload));let bin='';for(const b of bytes)bin+=String.fromCharCode(b);
      const pack=btoa(bin).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
      location.href=APP+'#leghe26='+pack;
    }catch(e){alert('Fanta Live: '+(e&&e.message?e.message:e))}})()`;
    return 'javascript:'+code.replace(/\s+/g,' ');
  }

  function indexPlayers(){
    const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[];
    const byId=new Map(),byName=new Map();
    for(const p of live){
      if(p.fcId)byId.set(String(p.fcId),p);
      for(const q of [p.name,p.alias].filter(Boolean)){const k=norm(q);if(!k)continue;if(!byName.has(k))byName.set(k,[]);byName.get(k).push(p)}
    }
    return {live,byId,byName};
  }
  function matchPlayer(row,idx){
    const d=idx.byId.get(String(row.i??''));if(d)return d;
    const a=idx.byName.get(norm(row.n))||[];
    if(a.length===1)return a[0];
    if(a.length>1){const t=norm(row.s),x=a.find(p=>norm(p.team)===t);return x||a[0]}
    return null;
  }
  function importPayload(data){
    if(!data||data.fl!==26||!Array.isArray(data.t)||data.t.length<2)throw Error('Pacchetto Leghe non valido.');
    const idx=indexPlayers();if(idx.live.length<100)return false;
    const s=read(),mineId=String(data.mt||'');
    s.teams=data.t.map((t,i)=>({id:String(t.i??('t'+(i+1))),name:String(t.n||('Squadra '+(i+1))),credits:Math.max(0,Math.round(+t.c||0)),initialCredits:Math.max(0,Math.round(+t.ci||0)),spentCredits:Math.max(0,Math.round(+t.cs||0)),roster:Array.isArray(t.r)?t.r:[],mine:mineId?String(t.i)===mineId:i===0}));
    if(!s.teams.some(t=>t.mine)&&s.teams[0])s.teams[0].mine=true;
    if(Array.isArray(data.f)&&data.f.length){
      const out=[],seen=new Set();
      for(const row of data.f){const p=matchPlayer(row,idx);if(!p)continue;const k=norm(p.name)+'|'+p.role;if(seen.has(k))continue;seen.add(k);out.push({...p})}
      if(out.length)s.freeAgents=out;s.importedFreeCount=out.length;s.sourceFreeCount=data.f.length;
    }
    s.leagueSize=s.teams.length;s.leagueId=data.lid??null;s.leagueName=String(data.ln||'Lega');s.sourceName='Leghe · import diretto';s.version=10;
    write(s);localStorage.setItem('fantaModeV2','repair');
    sessionStorage.setItem('fanta26Result',JSON.stringify({name:s.leagueName,teams:s.teams.length,free:s.importedFreeCount||0,total:s.sourceFreeCount||0}));
    return true;
  }
  function consumeHash(){
    const m=location.hash.match(/^#leghe26=([A-Za-z0-9_-]+)$/);if(!m)return;
    let data;try{data=JSON.parse(decode64url(m[1]))}catch(e){alert('Import Leghe non leggibile.');return}
    let n=0;const run=()=>{try{if(importPayload(data)){location.replace(APP+'#repair');return}}catch(e){alert('Import Leghe: '+e.message);return}if(++n<40)setTimeout(run,250);else alert('Il listone non è ancora pronto. Riapri Fanta Live e riprova.')};run();
  }
  function showToast(){
    let x;try{x=JSON.parse(sessionStorage.getItem('fanta26Result')||'null')}catch(e){}if(!x)return;sessionStorage.removeItem('fanta26Result');
    setTimeout(()=>{const t=document.createElement('div');t.className='private-import-toast show';t.textContent=`✓ ${x.name}: ${x.teams} squadre${x.free?` · ${x.free}/${x.total} svincolati`:''} importati`;document.body.appendChild(t);setTimeout(()=>t.remove(),5000)},500);
  }

  function modal(){
    ['legheImportModal','privateLegheImportModal','easyLegheModal'].forEach(id=>$(id)?.remove());
    let o=$('directLegheModal');if(o)return o;
    const chrome=/CriOS/i.test(navigator.userAgent);
    o=document.createElement('div');o.className='overlay';o.id='directLegheModal';
    o.innerHTML=`<div class="repair-sheet easy-leghe-sheet direct-leghe-sheet"><div class="grab"></div>
      <div class="leghe-import-head"><div><span class="repair-kicker">IMPORT DIRETTO</span><h3>Niente link da cercare</h3></div><span class="leghe-lock">🔒 locale</span></div>
      <p class="repair-help">Il metodo più affidabile da telefono: installi <b>una sola volta</b> il preferito “Fanta Live Import”. Poi lo lanci mentre sei dentro Leghe. Legge la tua sessione e importa squadre, crediti, rose e svincolati.</p>
      <div class="direct-steps">
        <div><b>1</b><span><strong>Una sola volta:</strong> premi “Copia Fanta Live Import”, crea un preferito nel browser e sostituisci il suo indirizzo con quello copiato.</span></div>
        <div><b>2</b><span>Apri Leghe Fantacalcio <strong>nello stesso browser</strong>, fai login e apri la lega. Va bene qualsiasi pagina: non serve /squadre.</span></div>
        <div><b>3</b><span>${chrome?'In Chrome tocca la barra indirizzi, scrivi <strong>Fanta Live Import</strong> e scegli il preferito.':'In Safari apri i Preferiti e tocca <strong>Fanta Live Import</strong>.'} Fanta Live si riapre da sola con i dati.</span></div>
      </div>
      <button class="repair-confirm easy-big" id="copyDirectImporter">📌 Copia Fanta Live Import</button>
      <button class="wide" id="openDirectLeghe">Apri Leghe Fantacalcio ↗</button>
      <div class="direct-security">Il token resta nel browser Leghe: <strong>non viene copiato né inviato a GitHub</strong>. Fanta Live riceve soltanto i dati della lega necessari all’asta.</div>
      <details class="private-fallback"><summary>Se preferisci un file</summary><button class="wide" id="directFileImport">📄 Importa file / JSON</button></details>
      <div class="leghe-status" id="directStatus">Browser rilevato: ${chrome?'Chrome iPhone':'Safari / WebKit'}.</div>
      <button class="repair-close" id="directClose">Chiudi</button></div>`;
    document.body.appendChild(o);
    $('directClose').onclick=()=>o.classList.remove('show');o.onclick=e=>{if(e.target===o)o.classList.remove('show')};
    $('copyDirectImporter').onclick=async()=>{
      const code=makeBookmarklet(),st=$('directStatus');
      try{await navigator.clipboard.writeText(code);st.innerHTML=`✓ Copiato. ${chrome?'Chrome: Share → Aggiungi segnalibro/preferito, poi modifica il suo URL e incolla il codice.':'Safari: Share → Aggiungi preferito, poi Preferiti → Modifica → incolla il codice nel campo indirizzo.'}`}
      catch(e){prompt('Copia questo codice come indirizzo del preferito “Fanta Live Import”:',code)}
    };
    $('openDirectLeghe').onclick=()=>window.open('https://leghe.fantacalcio.it/','_blank','noopener');
    $('directFileImport').onclick=()=>{o.classList.remove('show');$('repairCreditsFile')?.click()};
    return o;
  }
  function bind(){
    const b=$('importLeagueBtn')||$('importCreditsBtn')||$('importDirectLeagueBtn');if(!b)return;
    b.id='importDirectLeagueBtn';b.textContent='🔐 Importa Lega';b.title='Import diretto da Safari o Chrome';b.onclick=e=>{e.preventDefault();modal().classList.add('show')};
    const note=document.querySelector('.repair-source-note');if(note)note.textContent='Da iPhone: usa “Importa Lega”. Non devi trovare o copiare nessun link: funziona da Safari o Chrome mentre sei già autenticato su Leghe.';
    const v=document.querySelector('.aboutTitle span');if(v)v.textContent='Versione pubblica 2.6.0';
  }

  consumeHash();showToast();setTimeout(bind,1000);setTimeout(bind,2200);setTimeout(bind,4000);
})();
