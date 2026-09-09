/* Fanta Live 2.0 — asta di riparazione */
(function(){
  'use strict';
  const KEY='fantaRepairV1';
  const MODEKEY='fantaModeV2';
  const $r=id=>document.getElementById(id);
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const clean=v=>String(v??'').trim();
  const numberOf=v=>{const n=Number(String(v??'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};
  const escapeHtml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const roleOf=v=>{const s=clean(v).toUpperCase();if(['P','D','C','A'].includes(s))return s;return ({POR:'P',PORTIERE:'P',GK:'P',DIF:'D',DIFENSORE:'D',DEF:'D',CEN:'C',CENTROCAMPISTA:'C',MID:'C',ATT:'A',ATTACCANTE:'A',FWD:'A'})[s]||''};
  const pkey=p=>`${norm(p.name)}|${p.role}`;

  function initialState(){
    return {
      version:2,
      sourceName:'',
      freeAgents:[],
      teams:Array.from({length:8},(_,i)=>({id:'t'+(i+1),name:i===0?'La mia squadra':`Squadra ${i+1}`,credits:0,mine:i===0})),
      transactions:[],
      filter:'ALL'
    };
  }

  let repair;
  try{repair=JSON.parse(localStorage.getItem(KEY)||'null')||initialState()}catch(e){repair=initialState()}
  if(!Array.isArray(repair.freeAgents))repair.freeAgents=[];
  if(!Array.isArray(repair.teams)||!repair.teams.length)repair.teams=initialState().teams;
  if(!Array.isArray(repair.transactions))repair.transactions=[];
  if(!repair.filter)repair.filter='ALL';
  let selected=null;

  function save(){localStorage.setItem(KEY,JSON.stringify(repair));render()}
  function myTeam(){return repair.teams.find(t=>t.mine)||repair.teams[0]||null}
  function ranking(){return [...repair.teams].sort((a,b)=>(+b.credits||0)-(+a.credits||0))}
  function soldTx(p){return repair.transactions.find(t=>t.playerKey===pkey(p))}

  function livePlayer(p){
    if(typeof PLAYERS==='undefined'||!PLAYERS.length)return p;
    const n=norm(p.name),a=norm(p.alias||'');
    const hit=PLAYERS.find(x=>norm(x.name)===n||(a&&norm(x.name)===a));
    if(!hit)return p;
    return {
      ...p,...hit,
      sourceId:p.sourceId||hit.fcId||'',
      photo:hit.photo||p.photo||'',
      photoFallback:hit.photoFallback||p.photoFallback||'',
      photoCandidates:uniq([...(hit.photoCandidates||[]),hit.photo,hit.photoFallback,...(p.photoCandidates||[]),p.photo,p.photoFallback])
    };
  }
  const freePlayers=()=>repair.freeAgents.map(livePlayer);

  function switchMode(mode){
    const isRepair=mode==='repair';
    $r('auctionPanel').hidden=isRepair;
    $r('repairPanel').hidden=!isRepair;
    $r('auctionTab').classList.toggle('active',!isRepair);
    $r('repairTab').classList.toggle('active',isRepair);
    document.body.classList.toggle('repair-mode',isRepair);
    const theme=document.querySelector('meta[name="theme-color"]');
    if(theme)theme.content=isRepair?'#160b20':'#08111d';
    localStorage.setItem(MODEKEY,mode);
    if(isRepair)render();
  }

  function capFor(p){
    const me=myTeam();
    const credits=Math.max(0,+me?.credits||0);
    if(!credits)return 0;
    let base=typeof refCap==='function'?refCap(p):Math.max(1,Math.round((+p.fvm||1)/5));
    const richestOpponent=ranking().find(t=>!t.mine);
    let pressure=1;
    if(richestOpponent&&richestOpponent.credits>credits)pressure=1.08;
    else if(richestOpponent&&credits>richestOpponent.credits*1.35)pressure=.92;
    base=Math.round(base*pressure);
    return Math.max(1,Math.min(credits,base));
  }

  function photoHtml(p){
    try{return typeof img==='function'?img(p):`<div class="fallback">${p.role}</div>`}
    catch(e){return `<div class="fallback">${p.role}</div>`}
  }
  function tagsHtml(p){try{return typeof tags==='function'?tags(p):''}catch(e){return ''}}

  function summaryHtml(){
    const me=myTeam();
    if(!me)return '<strong>Configura le squadre</strong> per iniziare.';
    const list=ranking();
    const rank=list.findIndex(t=>t.id===me.id)+1;
    const avg=repair.teams.length?repair.teams.reduce((s,t)=>s+(+t.credits||0),0)/repair.teams.length:0;
    const diff=Math.round((+me.credits||0)-avg);
    const cls=diff>0?'good':diff<0?'bad':'warn';
    const open=freePlayers().filter(p=>!soldTx(p)).length;
    return `<strong>${escapeHtml(me.name)}</strong> è <strong>${rank}ª su ${repair.teams.length}</strong> per disponibilità economica. <span class="${cls}">${diff>0?'+':''}${diff} cr rispetto alla media</span>. ${open} svincolati ancora disponibili.`;
  }

  function filtered(){
    let list=freePlayers();
    const q=norm($r('repairSearch').value||'');
    if(q)list=list.filter(p=>norm(`${p.name} ${p.alias||''} ${p.team||''}`).includes(q));
    if(['P','D','C','A'].includes(repair.filter))list=list.filter(p=>p.role===repair.filter);
    if(repair.filter==='AVAILABLE')list=list.filter(p=>!soldTx(p));
    return list.sort((a,b)=>(soldTx(a)?1:0)-(soldTx(b)?1:0)||(+b.fvm||0)-(+a.fvm||0)||norm(a.name).localeCompare(norm(b.name))).slice(0,q?160:180);
  }

  function renderPower(){
    $r('repairPowerStrip').innerHTML=ranking().map((t,i)=>`<div class="power-team ${t.mine?'mine':''}"><b>${escapeHtml(t.name)}</b><span>${Math.max(0,+t.credits||0)}</span><small>${t.mine?'LA MIA SQUADRA':`${i+1}ª disponibilità`}</small></div>`).join('');
  }

  function render(){
    if(!$r('repairPanel'))return;
    const me=myTeam(),rank=me?ranking().findIndex(t=>t.id===me.id)+1:0;
    $r('repairMyCredits').textContent=me?Math.max(0,+me.credits||0):'—';
    $r('repairRank').textContent=me?`${rank}ª disponibilità su ${repair.teams.length}`:'Configura la tua squadra';
    $r('repairFreeCount').textContent=repair.freeAgents.length;
    $r('repairImportState').textContent=repair.sourceName?`Da ${repair.sourceName}`:'Nessun file importato';
    renderPower();
    $r('repairSummary').innerHTML=summaryHtml();

    const list=filtered();
    $r('repairCount').textContent=`${list.length} mostrati · ${repair.freeAgents.length} importati`;
    $r('repairResults').innerHTML=list.length?list.map(p=>{
      const tx=soldTx(p);
      return `<div class="repair-player ${p.role.toLowerCase()} ${tx?'unavailable':''}" data-rkey="${escapeHtml(pkey(p))}">
        <div class="photo">${photoHtml(p)}</div>
        <div><div class="name">${escapeHtml(p.name)}</div><div class="meta">${escapeHtml(p.team||'')} · Qt ${+p.q||0} · FVM ${+p.fvm||0}</div><div class="tags">${tagsHtml(p)}</div></div>
        <div class="repair-price"><b>${tx?escapeHtml(tx.teamName):capFor(p)}</b><small>${tx?`${tx.price} CR`:'MAX ORA'}</small></div>
      </div>`;
    }).join(''):`<div class="repair-empty">Importa il file degli svincolati della tua lega.<br>Sono supportati <b>.fclist</b>, JSON, CSV e TXT.</div>`;
    document.querySelectorAll('.repair-player').forEach(el=>el.onclick=()=>{
      const p=freePlayers().find(x=>pkey(x)===el.dataset.rkey);
      if(p&&!soldTx(p))openPlayer(p);
    });

    $r('repairTxCount').textContent=`${repair.transactions.length} acquisti registrati`;
    $r('repairTransactions').innerHTML=repair.transactions.length?[...repair.transactions].reverse().map(t=>`<div class="repair-tx"><div><b>${escapeHtml(t.playerName)}</b><small>${escapeHtml(t.teamName)}</small></div><div class="txprice">${t.price}</div><button data-tx="${escapeHtml(t.id)}">↶</button></div>`).join(''):`<div class="repair-empty">Nessun movimento registrato.</div>`;
    document.querySelectorAll('[data-tx]').forEach(b=>b.onclick=()=>undoTransaction(b.dataset.tx));
  }

  function openPlayer(p){
    selected=p;
    $r('repairPlayerName').textContent=p.name;
    $r('repairPlayerMeta').textContent=`${p.team||''} · ${p.role} · Qt ${+p.q||0} · FVM ${+p.fvm||0}`;
    $r('repairPlayerTags').innerHTML=tagsHtml(p);
    const photo=$r('repairModalPhoto');
    photo.className=`repair-photo photo big ${p.role.toLowerCase()}`;
    photo.innerHTML=photoHtml(p);
    $r('repairCap').textContent=capFor(p)||'—';
    const h=typeof health==='function'?health(p):null;
    const me=myTeam(),opp=ranking().find(t=>!t.mine);
    $r('repairPlayerInfo').innerHTML=`${h?`<strong>Condizione:</strong> ${escapeHtml(h.txt)}<br>`:''}<strong>Potere d'acquisto:</strong> ${me?`${escapeHtml(me.name)} ${me.credits} cr`:'da configurare'}${opp?` · rivale più ricco ${escapeHtml(opp.name)} ${opp.credits} cr`:''}.`;
    $r('repairBuyer').innerHTML=repair.teams.map(t=>`<option value="${escapeHtml(t.id)}" ${t.mine?'selected':''}>${escapeHtml(t.name)} — ${Math.max(0,+t.credits||0)} cr</option>`).join('');
    $r('repairPrice').value='';
    $r('repairPlayerModal').classList.add('show');
  }

  function closePlayer(){selected=null;$r('repairPlayerModal').classList.remove('show')}
  function undoTransaction(id){
    const i=repair.transactions.findIndex(t=>t.id===id);
    if(i<0)return;
    const t=repair.transactions[i],team=repair.teams.find(x=>x.id===t.teamId);
    if(team)team.credits=(+team.credits||0)+(+t.price||0);
    repair.transactions.splice(i,1);
    save();
  }

  function renderTeamsEditor(){
    $r('repairTeamsEditor').innerHTML=repair.teams.map((t,i)=>`<div class="repair-team-row ${t.mine?'mine-row':''}" data-teamrow="${i}"><label>Squadra<input data-teamname value="${escapeHtml(t.name)}"></label><label>Crediti<input data-teamcredits type="number" inputmode="numeric" min="0" value="${Math.max(0,+t.credits||0)}"></label><button data-mineteam title="Imposta come mia squadra">${t.mine?'★':'☆'}</button></div>`).join('');
    document.querySelectorAll('[data-mineteam]').forEach((b,i)=>b.onclick=()=>{repair.teams.forEach((t,j)=>t.mine=j===i);renderTeamsEditor()});
  }
  function openSetup(){renderTeamsEditor();$r('repairSetupModal').classList.add('show')}

  async function getCatalog(){
    const cacheKey='repairCatalogV2',day=new Date().toISOString().slice(0,10);
    try{const c=JSON.parse(localStorage.getItem(cacheKey)||'null');if(c?.day===day&&Array.isArray(c.rows))return c.rows}catch(e){}
    const r=await fetch(`https://cdn.jsdelivr.net/gh/bqit/fantaleghe-api-json@main/players.json?repair=2&d=${day}`,{cache:'no-store'});
    if(!r.ok)throw new Error('Catalogo giocatori non raggiungibile');
    const rows=await r.json();
    localStorage.setItem(cacheKey,JSON.stringify({day,rows}));
    return rows;
  }

  function catalogMaps(rows){
    const byId=new Map(),byName=new Map();
    for(const x of rows||[]){if(x?.id)byId.set(String(x.id),x);if(x?.name)byName.set(norm(x.name),x)}
    return {byId,byName};
  }

  function fromCatalog(x){
    if(!x)return null;
    const live=(typeof PLAYERS!=='undefined'?PLAYERS:[]).find(p=>norm(p.name)===norm(x.name));
    if(live)return livePlayer({...live,sourceId:String(x.id||'')});
    return {role:roleOf(x.position)||'C',name:clean(x.name)||'Sconosciuto',team:clean(x.team),q:+x.qt_att||+x.qt_i||0,fvm:+x.fvm||0,alias:'',sourceId:String(x.id||''),photo:x.playerImage||'',photoFallback:x.id?`https://content.fantacalcio.it/web/campioncini/21/card/${x.id}.png?v=642`:''};
  }

  function detectTeams(obj){
    const out=[],seen=new Set();
    const add=(name,credits,mineFlag)=>{
      name=clean(name);credits=numberOf(credits);
      if(!name||!Number.isFinite(credits))return;
      const k=norm(name);if(seen.has(k))return;seen.add(k);
      out.push({id:'t'+Math.random().toString(36).slice(2,9),name,credits:Math.max(0,Math.round(credits)),mine:!!mineFlag});
    };
    const scan=v=>{
      if(!v)return;
      if(Array.isArray(v)){v.forEach(scan);return}
      if(typeof v!=='object')return;
      const name=v.name??v.nome??v.squadra??v.team??v.teamName??v.nomeSquadra;
      const credits=v.credits??v.crediti??v.credit??v.budget??v.residuo??v.creditiResidui??v.remainingCredits;
      if(name!=null&&credits!=null)add(name,credits,v.mine??v.me??v.mia);
      for(const [k,val] of Object.entries(v)){
        if(['players','playersId','playerIds','svincolati','freeAgents','availablePlayers'].includes(k))continue;
        if(typeof val==='object')scan(val);
      }
    };
    scan(obj);return out;
  }

  function parseDelimited(text){
    const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!lines.length)return[];
    const semis=(lines[0].match(/;/g)||[]).length,commas=(lines[0].match(/,/g)||[]).length;
    const delim=semis>=commas?';':',';
    const headers=lines[0].split(delim).map(x=>norm(x).replace(/ /g,'_'));
    return lines.slice(1).map(line=>{const vals=line.split(delim).map(x=>x.trim().replace(/^"|"$/g,'')),o={};headers.forEach((h,i)=>o[h]=vals[i]??'');return o});
  }

  function teamsFromRows(rows){
    const out=[];
    for(const r of rows){
      const name=r.squadra||r.team||r.nome_squadra||r.nomesquadra||r.nome||r.name;
      const credits=r.crediti||r.crediti_residui||r.creditiresidui||r.budget||r.residuo||r.credits||r.credit;
      if(name&&credits!==undefined&&credits!=='')out.push({id:'t'+Math.random().toString(36).slice(2,9),name:clean(name),credits:Math.max(0,Math.round(numberOf(credits))),mine:false});
    }
    return out;
  }

  function mergeTeams(teams){
    if(!teams.length)return;
    const oldMine=myTeam()?.name||'';
    repair.teams=teams.map((t,i)=>({...t,id:t.id||'t'+(i+1),mine:oldMine?norm(t.name)===norm(oldMine):i===0}));
    if(!repair.teams.some(t=>t.mine)&&repair.teams[0])repair.teams[0].mine=true;
  }

  async function importFile(file,kind){
    if(!file)return;
    const text=await file.text();
    const catalog=await getCatalog(),maps=catalogMaps(catalog);
    let obj=null,rows=[];
    try{obj=JSON.parse(text)}catch(e){rows=parseDelimited(text)}
    let free=[],teams=[];

    if(obj){
      teams=detectTeams(obj);
      const ids=Array.isArray(obj.playersId)?obj.playersId:Array.isArray(obj.playerIds)?obj.playerIds:Array.isArray(obj.svincolatiId)?obj.svincolatiId:null;
      if(ids)free=ids.map(id=>fromCatalog(maps.byId.get(String(id)))).filter(Boolean);
      const arr=obj.players||obj.svincolati||obj.freeAgents||obj.availablePlayers;
      if(Array.isArray(arr)){
        for(const x of arr){
          if(typeof x==='number'||(typeof x==='string'&&/^\d+$/.test(x)))free.push(fromCatalog(maps.byId.get(String(x))));
          else if(typeof x==='string')free.push(fromCatalog(maps.byName.get(norm(x)))||((typeof PLAYERS!=='undefined'?PLAYERS:[]).find(p=>norm(p.name)===norm(x))));
          else if(x&&typeof x==='object'){
            const cat=x.id?maps.byId.get(String(x.id)):maps.byName.get(norm(x.name||x.nome||''));
            free.push(fromCatalog(cat)||{role:roleOf(x.role||x.position)||'C',name:clean(x.name||x.nome),team:clean(x.team||x.squadra),q:numberOf(x.q||x.qt),fvm:numberOf(x.fvm)});
          }
        }
      }
    }else if(rows.length){
      teams=teamsFromRows(rows);
      for(const r of rows){
        const idv=r.id||r.id_giocatore||r.idgiocatore||r.playerid;
        const name=r.giocatore||r.player||r.nome_giocatore||r.nomegiocatore||(!r.crediti&&!r.budget?r.nome:'');
        if(idv&&maps.byId.has(String(idv)))free.push(fromCatalog(maps.byId.get(String(idv))));
        else if(name){const cat=maps.byName.get(norm(name));if(cat)free.push(fromCatalog(cat));else{const lp=(typeof PLAYERS!=='undefined'?PLAYERS:[]).find(p=>norm(p.name)===norm(name));if(lp)free.push(livePlayer(lp))}}
      }
    }

    free=free.filter(Boolean).filter(p=>p.name);
    const dedup=new Map();free.forEach(p=>dedup.set(pkey(p),p));free=[...dedup.values()];

    if(kind==='free'){
      if(!free.length)alert('Nel file non ho trovato giocatori svincolati riconoscibili. Se è un formato particolare, mandamelo e aggiungo il parser.');
      else{repair.freeAgents=free;repair.sourceName=file.name;repair.transactions=[]}
      if(teams.length)mergeTeams(teams);
    }else{
      if(teams.length)mergeTeams(teams);else alert('Nel file non ho trovato nomi squadra + crediti residui. Puoi inserirli manualmente da “Squadre”.');
      if(free.length&&!repair.freeAgents.length){repair.freeAgents=free;repair.sourceName=file.name}
    }
    save();
  }

  $r('auctionTab').onclick=()=>switchMode('auction');
  $r('repairTab').onclick=()=>switchMode('repair');
  $r('repairSearch').oninput=render;
  $r('repairClear').onclick=()=>{$r('repairSearch').value='';render()};
  document.querySelectorAll('#repairChips [data-rf]').forEach(b=>b.onclick=()=>{repair.filter=b.dataset.rf;document.querySelectorAll('#repairChips [data-rf]').forEach(x=>x.classList.toggle('active',x===b));save()});

  $r('repairClosePlayer').onclick=closePlayer;
  $r('repairPlayerModal').onclick=e=>{if(e.target===$r('repairPlayerModal'))closePlayer()};
  $r('repairBuyBtn').onclick=()=>{
    if(!selected)return;
    const team=repair.teams.find(t=>t.id===$r('repairBuyer').value),price=Math.max(0,Math.round(numberOf($r('repairPrice').value)));
    if(!team||price<1)return alert('Inserisci squadra e prezzo.');
    if(price>team.credits&&!confirm(`${team.name} ha ${team.credits} crediti. Registrare comunque ${price}?`))return;
    team.credits=Math.max(0,(+team.credits||0)-price);
    repair.transactions.push({id:'tx'+Date.now(),playerKey:pkey(selected),playerName:selected.name,role:selected.role,teamId:team.id,teamName:team.name,price,ts:Date.now()});
    closePlayer();save();
  };

  $r('repairSetupBtn').onclick=openSetup;
  $r('repairSettingsBtn').onclick=openSetup;
  $r('repairCloseSetup').onclick=()=> $r('repairSetupModal').classList.remove('show');
  $r('repairSetupModal').onclick=e=>{if(e.target===$r('repairSetupModal'))$r('repairCloseSetup').click()};
  $r('repairAddTeam').onclick=()=>{repair.teams.push({id:'t'+Date.now(),name:`Squadra ${repair.teams.length+1}`,credits:0,mine:false});renderTeamsEditor()};
  $r('repairSaveTeams').onclick=()=>{
    document.querySelectorAll('[data-teamrow]').forEach((row,i)=>{if(!repair.teams[i])return;repair.teams[i].name=clean(row.querySelector('[data-teamname]').value)||`Squadra ${i+1}`;repair.teams[i].credits=Math.max(0,Math.round(numberOf(row.querySelector('[data-teamcredits]').value)))});
    if(!repair.teams.some(t=>t.mine)&&repair.teams[0])repair.teams[0].mine=true;
    $r('repairCloseSetup').click();save();
  };
  $r('repairReset').onclick=()=>{if(confirm('Azzerare solo i dati dell’asta di riparazione? L’asta principale non verrà toccata.')){repair=initialState();localStorage.removeItem(KEY);$r('repairCloseSetup').click();render()}};

  $r('importFreeBtn').onclick=()=> $r('repairFreeFile').click();
  $r('importCreditsBtn').onclick=()=> $r('repairCreditsFile').click();
  $r('repairFreeFile').onchange=async e=>{try{await importFile(e.target.files[0],'free')}catch(err){alert('Errore importazione: '+err.message)}e.target.value=''};
  $r('repairCreditsFile').onchange=async e=>{try{await importFile(e.target.files[0],'credits')}catch(err){alert('Errore importazione: '+err.message)}e.target.value=''};

  switchMode(localStorage.getItem(MODEKEY)==='repair'?'repair':'auction');
  render();
  window.addEventListener('load',()=>{setTimeout(render,900);setTimeout(render,2200)});
})();