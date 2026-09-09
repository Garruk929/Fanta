/* Fanta Live 2.4.0 — import privato Leghe da Safari, senza link */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const APP='https://garruk929.github.io/Fanta/?v=2.4.0';
  const APP_KEY='ICiELOObd5DF5uJEATi77CRvHiiRuMU0';
  const REPAIR_KEY='fantaRepairV1';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function b64urlDecode(text){
    let s=String(text||'').replace(/-/g,'+').replace(/_/g,'/');
    s+='='.repeat((4-s.length%4)%4);
    const bin=atob(s),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function privateBookmarklet(){
    const target=APP;
    const key=APP_KEY;
    const code=`(async()=>{try{
      if(!/(^|\\.)leghe\\.fantacalcio\\.it$/i.test(location.hostname))throw Error('Apri prima Leghe Fantacalcio in Safari ed effettua il login.');
      const raw=localStorage.getItem('LEAGUES2024_LOCAL');if(!raw)throw Error('Sessione Leghe non trovata. Accedi da Safari e riprova.');
      const blob=JSON.parse(raw),uid=blob['current-user'],user=blob['current-user-'+uid];if(!user)throw Error('Profilo Leghe non trovato.');
      const leagues=Array.isArray(user.leagues)?user.leagues:[];if(!leagues.length)throw Error('Nessuna lega trovata nel tuo account.');
      const path=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
      let league=leagues.find(x=>String(x.alias||'').toLowerCase()===path)||user.currentLeague||leagues[0];
      if(leagues.length>1&&!leagues.includes(league))league=leagues[0];
      if(leagues.length>1&&(!path||!leagues.some(x=>String(x.alias||'').toLowerCase()===path))){
        const list=leagues.map((x,i)=>(i+1)+'. '+(x.name||x.alias||x.id)).join('\\n');
        const pick=prompt('Quale lega vuoi importare?\\n'+list,String(Math.max(1,leagues.indexOf(league)+1)));
        if(pick===null)return;const n=Math.max(1,Math.min(leagues.length,parseInt(pick,10)||1));league=leagues[n-1];
      }
      const token=String(league.token||'');if(!token)throw Error('Token della lega non trovato. Esci e rientra su Leghe.');
      let myTeam=0;try{let p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');p+='='.repeat((4-p.length%4)%4);myTeam=+(JSON.parse(atob(p)).t_id||0)||0}catch(e){}
      const headers={'app_key':'${key}','Authorization':'Bearer '+token};
      const get=async path=>{const r=await fetch('https://apileague.fantacalcio.it'+path,{headers,cache:'no-store'});if(!r.ok)throw Error('Leghe API '+r.status+'. Riapri Leghe e riprova.');return r.json()};
      let teams=[],page=1;
      while(page<=10){
        const body=await get('/onboarding/v1/league/teams?page='+page+'&pageSize=50&division=A');
        const rows=Array.isArray(body.data)?body.data:[];teams.push(...rows);
        if(!rows.length||!Number.isInteger(body.pages)||page>=body.pages)break;page++;
      }
      if(!teams.length)throw Error('Non riesco a leggere le squadre di questa lega.');
      const poolBody=await get('/onboarding/v1/league/players'),pool=Array.isArray(poolBody.players)?poolBody.players:[];
      const owned=new Set();
      const compactTeams=teams.map(t=>{
        const ids=String(t.cal||'').split(';').filter(Boolean),costs=String(t.cs||'').split(';').filter(Boolean);
        ids.forEach(id=>owned.add(String(id)));
        return {i:+t.id||t.id,n:String(t.n||''),c:+t.cr||0,ci:+t.cri||0,cs:+t.crs||0,r:ids.map((id,j)=>[+id||id,+costs[j]||0])};
      });
      const free=pool.filter(p=>!owned.has(String(p.id))).map(p=>({i:+p.id||p.id,n:String(p.name||''),s:String(p.stnme||'')}));
      const payload={fl:1,lid:+league.id||league.id,ln:String(league.name||league.alias||'Lega'),mt:myTeam,t:compactTeams,f:free,ts:Date.now()};
      const json=JSON.stringify(payload),bytes=new TextEncoder().encode(json);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);
      const packed=btoa(bin).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
      location.href='${target}#leghe-private='+packed;
    }catch(e){alert('Fanta Live: '+(e&&e.message?e.message:e))}})()`;
    return 'javascript:'+code.replace(/\s+/g,' ');
  }

  function readRepair(){try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{teams:[],freeAgents:[],transactions:[]}}catch(e){return {teams:[],freeAgents:[],transactions:[]}}}
  function writeRepair(state){localStorage.setItem(REPAIR_KEY,JSON.stringify(state))}

  function playerIndex(){
    const live=(typeof PLAYERS!=='undefined'&&Array.isArray(PLAYERS))?PLAYERS:[];
    const byName=new Map(),byId=new Map();
    for(const p of live){
      if(p.fcId)byId.set(String(p.fcId),p);
      for(const raw of [p.name,p.alias].filter(Boolean)){
        const n=norm(raw);if(!n)continue;
        if(!byName.has(n))byName.set(n,[]);byName.get(n).push(p);
      }
    }
    return {live,byName,byId};
  }
  function matchPlayer(row,idx){
    const direct=idx.byId.get(String(row.i||''));if(direct)return direct;
    const n=norm(row.n),team=norm(row.s),arr=idx.byName.get(n)||[];
    if(arr.length===1)return arr[0];
    if(arr.length>1&&team){const exact=arr.find(p=>norm(p.team)===team);if(exact)return exact}
    if(arr.length)return arr[0];
    for(const p of idx.live){const a=norm(p.alias);if(a&&n&&(' '+a+' ').includes(' '+n+' '))return p}
    return null;
  }

  function toast(text){
    let el=$('privateImportToast');if(!el){el=document.createElement('div');el.id='privateImportToast';el.className='private-import-toast';document.body.appendChild(el)}
    el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000);
  }

  function importPrivatePayload(data){
    if(!data||data.fl!==1||!Array.isArray(data.t)||data.t.length<2)throw new Error('Dati della lega non validi.');
    const idx=playerIndex();if(idx.live.length<100)return false;
    const state=readRepair(),myId=String(data.mt||'');
    state.teams=data.t.map((t,i)=>({
      id:String(t.i??('t'+(i+1))),name:String(t.n||('Squadra '+(i+1))),credits:Math.max(0,Math.round(+t.c||0)),
      mine:myId?String(t.i)===myId:i===0,initialCredits:Math.max(0,Math.round(+t.ci||0)),spentCredits:Math.max(0,Math.round(+t.cs||0)),roster:Array.isArray(t.r)?t.r:[]
    }));
    if(!state.teams.some(t=>t.mine)&&state.teams[0])state.teams[0].mine=true;
    const mapped=[],seen=new Set();
    for(const row of Array.isArray(data.f)?data.f:[]){
      const p=matchPlayer(row,idx);if(!p)continue;const k=norm(p.name)+'|'+p.role;if(seen.has(k))continue;seen.add(k);mapped.push({...p});
    }
    state.freeAgents=mapped;state.leagueSize=state.teams.length;state.leagueId=data.lid||null;state.leagueName=String(data.ln||'Lega');
    state.sourceName='Leghe privata · '+state.leagueName;state.transactions=[];state.version=6;writeRepair(state);localStorage.setItem('fantaModeV2','repair');
    sessionStorage.setItem('fantaPrivateImportResult',JSON.stringify({teams:state.teams.length,free:mapped.length,totalFree:(data.f||[]).length,name:state.leagueName}));
    return true;
  }

  function consumeHash(){
    const m=location.hash.match(/^#leghe-private=([A-Za-z0-9_-]+)$/);if(!m)return;
    let data;try{data=JSON.parse(b64urlDecode(m[1]))}catch(e){toast('Import Leghe non valido.');return}
    let tries=0;
    const run=()=>{
      try{if(importPrivatePayload(data)){history.replaceState(null,'',location.pathname+location.search+'#repair');$('repairTab')?.click();setTimeout(()=>location.reload(),120);return}}
      catch(e){toast('Import Leghe: '+e.message);return}
      if(++tries<30)setTimeout(run,250);else toast('Listone non ancora pronto: riapri Fanta Live e riprova.');
    };
    run();
  }

  function showResult(){
    let r=null;try{r=JSON.parse(sessionStorage.getItem('fantaPrivateImportResult')||'null')}catch(e){}
    if(!r)return;sessionStorage.removeItem('fantaPrivateImportResult');
    setTimeout(()=>toast(`✓ ${r.name}: ${r.teams} squadre e ${r.free}/${r.totalFree} svincolati importati`),450);
  }

  function installModal(){
    $('legheImportModal')?.remove();
    let o=$('privateLegheImportModal');if(o)return o;
    o=document.createElement('div');o.className='overlay';o.id='privateLegheImportModal';
    o.innerHTML=`<div class="repair-sheet leghe-import-sheet private-leghe-sheet">
      <div class="grab"></div>
      <div class="leghe-import-head"><div><span class="repair-kicker">IMPORT LEGA PRIVATA</span><h3>Leghe → Fanta Live</h3></div><span class="leghe-lock">🔒 locale</span></div>
      <p class="repair-help">Non serve trovare il link <b>/squadre</b>. Funziona anche con una lega privata: il preferito legge i dati mentre sei già autenticato su Leghe e torna qui da solo.</p>
      <div class="private-import-steps">
        <div><b>1</b><span><strong>Solo la prima volta:</strong> copia il preferito Fanta Live e salvalo in Safari.</span></div>
        <div><b>2</b><span>Apri <strong>Leghe Fantacalcio</strong> in Safari, fai login e apri la lega che vuoi importare. Va bene <strong>qualsiasi pagina</strong> della lega.</span></div>
        <div><b>3</b><span>Tocca il preferito <strong>Fanta Live Import</strong>. Squadre, crediti e svincolati vengono letti e Fanta Live si riapre automaticamente.</span></div>
      </div>
      <button class="repair-confirm private-primary" id="copyPrivateImporter">📌 Copia “Fanta Live Import”</button>
      <button class="wide" id="openPrivateLeghe">Apri Leghe Fantacalcio ↗</button>
      <div class="private-security">Il token della tua sessione <strong>non viene copiato, salvato o inviato a Fanta Live</strong>: viene usato solo dentro la pagina Leghe per leggere i dati della tua lega. Nel ritorno passano soltanto nomi squadre, crediti, rose e svincolati.</div>
      <details class="private-fallback"><summary>Alternative</summary><button class="wide" id="privateFileFallback">📄 Importa file / JSON</button></details>
      <div class="leghe-status" id="privateImportStatus">Pronto per configurare il preferito.</div>
      <button class="repair-close" id="closePrivateLeghe">Chiudi</button>
    </div>`;
    document.body.appendChild(o);
    $('closePrivateLeghe').onclick=()=>o.classList.remove('show');o.onclick=e=>{if(e.target===o)o.classList.remove('show')};
    $('copyPrivateImporter').onclick=async()=>{
      const code=privateBookmarklet(),st=$('privateImportStatus');
      try{await navigator.clipboard.writeText(code);st.innerHTML='✓ Copiato. In Safari crea/modifica un preferito chiamato <b>Fanta Live Import</b> e incolla questo codice al posto dell’indirizzo.'}
      catch(e){prompt('Copia questo indirizzo nel preferito Safari:',code)}
    };
    $('openPrivateLeghe').onclick=()=>window.open('https://leghe.fantacalcio.it/','_blank','noopener');
    $('privateFileFallback').onclick=()=>{o.classList.remove('show');$('repairCreditsFile')?.click()};
    return o;
  }

  function openModal(){installModal().classList.add('show')}
  function bind(){
    const b=$('importCreditsBtn');if(b){b.textContent='🔐 Importa Lega';b.title='Importa automaticamente anche una lega privata'}
    if(!document.documentElement.dataset.privateImporterBound){
      document.documentElement.dataset.privateImporterBound='1';
      document.addEventListener('click',e=>{const hit=e.target?.closest?.('#importCreditsBtn');if(!hit)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openModal()},true);
    }
    if(location.hash==='#import-leghe'||location.hash==='#import-leghe-private')setTimeout(openModal,350);
  }

  bind();consumeHash();showResult();setTimeout(bind,700);
})();