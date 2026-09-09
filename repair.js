/* Fanta Live 2.0 — asta di riparazione */
(function(){
  const KEY='fantaRepairV1';
  const MODEKEY='fantaModeV2';
  const $r=id=>document.getElementById(id);
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const num=v=>{const n=Number(String(v??'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};
  const clean=s=>String(s??'').trim();
  const roleOf=v=>{const s=clean(v).toUpperCase();if(['P','D','C','A'].includes(s))return s;const m={POR:'P',PORTIERE:'P',GK:'P',DIF:'D',DIFENSORE:'D',DEF:'D',CEN:'C',CENTROCAMPISTA:'C',MID:'C',ATT:'A',ATTACCANTE:'A',FWD:'A'};return m[s]||''};
  const repairKey=p=>`${norm(p.name)}|${p.role}`;
  const starter=()=>({version:2,sourceName:'',freeAgents:[],teams:Array.from({length:(window.cfg?.teams||8)},(_,i)=>({id:'t'+(i+1),name:i===0?'La mia squadra':`Squadra ${i+1}`,credits:0,mine:i===0})),transactions:[],filter:'ALL'});
  let repair;
  try{repair=JSON.parse(localStorage.getItem(KEY)||'null')||starter()}catch(e){repair=starter()}
  if(!Array.isArray(repair.freeAgents))repair.freeAgents=[];
  if(!Array.isArray(repair.teams)||!repair.teams.length)repair.teams=starter().teams;
  if(!Array.isArray(repair.transactions))repair.transactions=[];
  if(!repair.filter)repair.filter='ALL';
  let selectedRepair=null;

  function saveRepair(){localStorage.setItem(KEY,JSON.stringify(repair));renderRepair()}
  function mine(){return repair.teams.find(t=>t.mine)||repair.teams[0]||null}
  function txFor(p){return repair.transactions.find(t=>t.playerKey===repairKey(p))}
  function livePlayer(p){
    if(typeof PLAYERS==='undefined'||!PLAYERS.length)return p;
    const pn=norm(p.name),pa=norm(p.alias||'');
    const hit=PLAYERS.find(x=>norm(x.name)===pn||pn&&norm(x.alias||'').split(' ').includes(pn)||pa&&norm(x.name)===pa);
    return hit?{...p,...hit,sourceId:p.sourceId||hit.fcId||'',photo:hit.photo||p.photo||'',photoFallback:hit.photoFallback||p.photoFallback||'',photoCandidates:uniq([...(hit.photoCandidates||[]),hit.photo,hit.photoFallback,...(p.photoCandidates||[]),p.photo,p.photoFallback])}:p;
  }
  function allFree(){return repair.freeAgents.map(livePlayer)}

  function switchMode(mode){
    const rep=mode==='repair';
    $r('auctionPanel').hidden=rep;$r('repairPanel').hidden=!rep;
    $r('auctionTab').classList.toggle('active',!rep);$r('repairTab').classList.toggle('active',rep);
    document.body.classList.toggle('repair-mode',rep);
    const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content=rep?'#160b20':'#08111d';
    localStorage.setItem(MODEKEY,mode);
    if(rep)renderRepair();
  }
  $r('auctionTab').onclick=()=>switchMode('auction');
  $r('repairTab').onclick=()=>switchMode('repair');

  function creditsRanking(){return [...repair.teams].sort((a,b)=>(+b.credits||0)-(+a.credits||0))}
  function renderPower(){
    const box=$r('repairPowerStrip');
    if(!repair.teams.length){box.innerHTML='';return}
    box.innerHTML=creditsRanking().map((t,i)=>`<div class="power-team ${t.mine?'mine':''}"><b>${escapeHtml(t.name)}</b><span>${Math.max(0,+t.credits||0)}</span><small>${t.mine?'LA MIA SQUADRA':`${i+1}ª disponibilità`}</small></div>`).join('');
  }
  function escapeHtml(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function repairCap(p){
    const me=mine(),credits=Math.max(0,+me?.credits||0);if(!credits)return 0;
    let base=typeof refCap==='function'?refCap(p):Math.max(1,Math.round((+p.fvm||1)/5));
    const opp=creditsRanking().find(t=>!t.mine),pressure=opp&&opp.credits>credits?1.08:opp&&credits>opp.credits*1.35?.92:1;
    base=Math.round(base*pressure);
    return Math.max(1,Math.min(credits,base));
  }
  function summaryHTML(){
    const me=mine();
    if(!me)return '<strong>Configura le squadre</strong> per iniziare a seguire la riparazione.';
    const rank=creditsRanking().findIndex(t=>t.id===me.id)+1,avg=repair.teams.length?repair.teams.reduce((s,t)=>s+(+t.credits||0),0)/repair.teams.length:0,diff=Math.round((+me.credits||0)-avg);
    const cls=diff>0?'good':diff<0?'bad':'warn';
    const open=allFree().filter(p=>!txFor(p)).length;
    return `<strong>${escapeHtml(me.name)}</strong> è <strong>${rank}ª su ${repair.teams.length}</strong> per disponibilità economica. <span class="${cls}">${diff>0?'+':''}${diff} cr rispetto alla media</span>. ${open} svincolati ancora disponibili.`;
  }
  function filteredRepair(){
    let list=allFree(),q=norm($r('repairSearch').value||'');
    if(q)list=list.filter(p=>norm(`${p.name} ${p.alias||''} ${p.team||''}`).includes(q));
    if(['P','D','C','A'].includes(repair.filter))list=list.filter(p=>p.role===repair.filter);
    if(repair.filter==='AVAILABLE')list=list.filter(p=>!txFor(p));
    return list.sort((a,b)=>(txFor(a)?1:0)-(txFor(b)?1:0)||(+b.fvm||0)-(+a.fvm||0)||norm(a.name).localeCompare(norm(b.name))).slice(0,q?160:180);
  }
  function repairPhoto(p){
    try{return typeof img==='function'?img(p):`<div class="fallback">${p.role}</div>`}catch(e){return `<div class="fallback">${p.role}</div>`}
  }
  function repairTags(p){try{return typeof tags==='function'?tags(p):''}catch(e){return ''}}
  function renderRepair(){
    if(!$r('repairPanel'))return;
    const me=mine(),ranking=creditsRanking(),rank=me?ranking.findIndex(t=>t.id===me.id)+1:0;
    $r('repairMyCredits').textContent=me?Math.max(0,+me.credits||0):'—';
    $r('repairRank').textContent=me?`${rank}ª disponibilità su ${repair.teams.length}`:'Configura la tua squadra';
    $r('repairFreeCount').textContent=repair.freeAgents.length;
    $r('repairImportState').textContent=repair.sourceName?`Da ${repair.sourceName}`:'Nessun file importato';
    renderPower();$r('repairSummary').innerHTML=summaryHTML();
    const list=filteredRepair();$r('repairCount').textContent=`${list.length} mostrati · ${repair.freeAgents.length} importati`;
    $r('repairResults').innerHTML=list.length?list.map(p=>{const sold=txFor(p);return `<div class="repair-player ${p.role.toLowerCase()} ${sold?'unavailable':''}" data-rkey="${escapeHtml(repairKey(p))}"><div class="photo">${repairPhoto(p)}</div><div><div class="name">${escapeHtml(p.name)}</div><div class="meta">${escapeHtml(p.team||'')} · Qt ${+p.q||0} · FVM ${+p.fvm||0}</div><div class="tags">${repairTags(p)}</div></div><div class="repair-price"><b>${sold?escapeHtml(sold.teamName):repairCap(p)}</b><small>${sold?`${sold.price} CR`:'MAX ORA'}</small></div></div>`}).join(''):`<div class="repair-empty">Importa il file degli svincolati della tua lega.<br>Sono supportati <b>.fclist</b>, JSON, CSV e TXT.</div>`;
    document.querySelectorAll('.repair-player').forEach(el=>el.onclick=()=>{const p=allFree().find(x=>repairKey(x)===el.dataset.rkey);if(p&&!txFor(p))openRepairPlayer(p)});
    $r('repairTxCount').textContent=`${repair.transactions.length} acquisti registrati`;
    $r('repairTransactions').innerHTML=repair.transactions.length?[...repair.transactions].reverse().map(t=>`<div class="repair-tx"><div><b>${escapeHtml(t.playerName)}</b><small>${escapeHtml(t.teamName)}</small></div><div class="txprice">${t.price}</div><button data-tx="${escapeHtml(t.id)}">↶</button></div>`).join(''):`<div class="repair-empty">Nessun movimento registrato.</div>`;
    document.querySelectorAll('[data-tx]').forEach(b=>b.onclick=()=>undoTx(b.dataset.tx));
  }

  function openRepairPlayer(p){
    selectedRepair=p;
    $r('repairPlayerName').textContent=p.name;$r('repairPlayerMeta').textContent=`${p.team||''} · ${p.role} · Qt ${+p.q||0} · FVM ${+p.fvm||0}`;$r('repairPlayerTags').innerHTML=repairTags(p);
    const ph=$r('repairModalPhoto');ph.className=`repair-photo photo big ${p.role.toLowerCase()}`;ph.innerHTML=repairPhoto(p);
    $r('repairCap').textContent=repairCap(p)||'—';
    const h=typeof health==='function'?health(p):null;
    const me=mine(),opp=creditsRanking().find(t=>!t.mine);
    $r('repairPlayerInfo').innerHTML=`${h?`<strong>Condizione:</strong> ${escapeHtml(h.txt)}<br>`:''}<strong>Potere d'acquisto:</strong> ${me?`${escapeHtml(me.name)} ${me.credits} cr`: 'da configurare'}${opp?` · rivale più ricco ${escapeHtml(opp.name)} ${opp.credits} cr`:''}.`;
    $r('repairBuyer').innerHTML=repair.teams.map(t=>`<option value="${escapeHtml(t.id)}" ${t.mine?'selected':''}>${escapeHtml(t.name)} — ${Math.max(0,+t.credits||0)} cr</option>`).join('');
    $r('repairPrice').value='';$r('repairPlayerModal').classList.add('show');
  }
  $r('repairClosePlayer').onclick=()=>{$r('repairPlayerModal').classList.remove('show');selectedRepair=null};
  $r('repairPlayerModal').onclick=e=>{if(e.target===$r('repairPlayerModal'))$r('repairClosePlayer').click()};
  $r('repairBuyBtn').onclick=()=>{
    if(!selectedRepair)return;const team=repair.teams.find(t=>t.id===$r('repairBuyer').value),price=Math.max(0,Math.round(num($r('repairPrice').value)));
    if(!team||price<1)return alert('Inserisci squadra e prezzo.');if(price>team.credits&&!confirm(`${team.name} ha ${team.credits} crediti. Registrare comunque ${price}?`))return;
    team.credits=Math.max(0,(+team.credits||0)-price);
    repair.transactions.push({id:'tx'+Date.now(),playerKey:repairKey(selectedRepair),playerName:selectedRepair.name,role:selectedRepair.role,teamId:team.id,teamName:team.name,price,ts:Date.now()});
    $r('repairClosePlayer').click();saveRepair();
  };
  function undoTx(id){const i=repair.transactions.findIndex(t=>t.id===id);if(i<0)return;const t=repair.transactions[i],team=repair.teams.find(x=>x.id===t.teamId);if(team)team.credits=(+team.credits||0)+(+t.price||0);repair.transactions.splice(i,1);saveRepair()}

  function renderTeamsEditor(){
    $r('repairTeamsEditor').innerHTML=repair.teams.map((t,i)=>`<div class="repair-team-row ${t.mine?'mine-row':''}" data-teamrow="${i}"><label>Squadra<input data-teamname value="${escapeHtml(t.name)}"></label><label>Crediti<input data-teamcredits type="number" inputmode="numeric" min="0" value="${Math.max(0,+t.credits||0)}"></label><button data-mineteam title="Imposta come mia squadra">${t.mine?'★':'☆'}</button></div>`).join('');
    document.querySelectorAll('[data-mineteam]').forEach((b,i)=>b.onclick=()=>{repair.teams.forEach((t,j)=>t.mine=j===i);renderTeamsEditor()});
  }
  function openSetup(){renderTeamsEditor();$r('repairSetupModal').classList.add('show')}
  $r('repairSetupBtn').onclick=openSetup;$r('repairSettingsBtn').onclick=openSetup;
  $r('repairCloseSetup').onclick=()=> $r('repairSetupModal').classList.remove('show');
  $r('repairSetupModal').onclick=e=>{if(e.target===$r('repairSetupModal'))$r('repairCloseSetup').click()};
  $r('repairAddTeam').onclick=()=>{repair.teams.push({id:'t'+Date.now(),name:`Squadra ${repair.teams.length+1}`,credits:0,mine:false});renderTeamsEditor()};
  $r('repairSaveTeams').onclick=()=>{
    document.querySelectorAll('[data-teamrow]').forEach((row,i)=>{if(!repair.teams[i])return;repair.teams[i].name=clean(row.querySelector('[data-teamname]').value)||`Squadra ${i+1}`;repair.teams[i].credits=Math.max(0,Math.round(num(row.querySelector('[data-teamcredits]').value)))});
    if(!repair.teams.some(t=>t.mine)&&repair.teams[0])repair.teams[0].mine=true;$r('repairCloseSetup').click();saveRepair();
  };
  $r('repairReset').onclick=()=>{if(confirm('Azzerare solo i dati dell’asta di riparazione? L’asta principale non verrà toccata.')){repair=starter();localStorage.removeItem(KEY);$r('repairCloseSetup').click();renderRepair()}};

  async function getCatalog(){
    const ck='repairCatalogV2',day=new Date().toISOString().slice(0,10);try{const c=JSON.parse(localStorage.getItem(ck)||'null');if(c?.day&&c.day===day&&Array.isArray(c.rows))return c.rows}catch(e){}
    const r=await fetch(`https://cdn.jsdelivr.net/gh/bqit/fantaleghe-api-json@main/players.json?repair=2&d=${day}`,{cache:'no-store'});if(!r.ok)throw new Error('Catalogo giocatori non raggiungibile');const rows=await r.json();localStorage.setItem(ck,JSON.stringify({day,rows}));return rows;
  }
  function catalogMaps(rows){const id=new Map(),name=new Map();for(const x of rows||[]){if(x?.id)id.set(String(x.id),x);if(x?.name)name.set(norm(x.name),x)}return{id,name}}
  function fromCatalog(x){if(!x)return null;const live=(typeof PLAYERS!=='undefined'?PLAYERS:[]).find(p=>norm(p.name)===norm(x.name));if(live)return livePlayer({...live,sourceId:String(x.id||'')});return {role:roleOf(x.position)||'C',name:clean(x.name)||'Sconosciuto',team:clean(x.team),q:+x.qt_att||+x.qt_i||0,fvm:+x.fvm||0,alias:'',sourceId:String(x.id||''),photo:x.playerImage||'',photoFallback:x.id?`https://content.fantacalcio.it/web/campioncini/21/card/${x.id}.png?v=642`:''}}
  function detectTeams(obj){
    const found=[];const seen=new Set();
    const add=(name,credits,mineFlag)=>{name=clean(name);if(!name||!Number.isFinite(Number(credits)))return;const k=norm(name);if(seen.has(k))return;seen.add(k);found.push({id:'t'+Math.random().toString(36).slice(2,9),name,credits:Math.max(0,Math.round(Number(credits))),mine:!!mineFlag})};
    const scan=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(scan);return}if(typeof v!=='object')return;const name=v.name??v.nome??v.squadra??v.team??v.teamName??v.nomeSquadra;const credits=v.credits??v.crediti??v.credit??v.budget??v.residuo??v.creditiResidui??v.remainingCredits;if(name!=null&&credits!=null)add(name,num(credits),v.mine??v.me??v.mia);for(const [k,val] of Object.entries(v)){if(['players','playersId','svincolati','freeAgents'].includes(k))continue;if(typeof val==='object')scan(val)}};
    scan(obj);return found;
  }
  function parseDelimited(text){
    const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return[];const delim=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',';const headers=lines[0].split(delim).map(x=>norm(x));return lines.slice(1).map(line=>{const vals=line.split(delim).map(x=>x.trim().replace(/^"|"$/g,'')),o={};headers.forEach((h,i)=>o[h]=vals[i]??'');return o})
  }
  function teamsFromRows(rows){const out=[];for(const r of rows){const name=r.squadra||r.team||r.nome_squadra||r.nomesquadra||r.nome||r.name;const cr=r.crediti||r.crediti_residui||r.creditiresidui||r.budget||r.residuo||r.credits||r.credit;if(name&&cr!==undefined&&cr!=='')out.push({id:'t'+Math.random().toString(36).slice(2,9),name:clean(name),credits:Math.max(0,Math.round(num(cr))),mine:false})}return out}
  async function importFile(file,kind){
    if(!file)return;const text=await file.text(),catalog=await getCatalog(),maps=catalogMaps(catalog);let obj=null,rows=[];try{obj=JSON.parse(text)}catch(e){rows=parseDelimited(text)}
    let free=[],teams=[];
    if(obj){
      teams=detectTeams(obj);
      const ids=Array.isArray(obj.playersId)?obj.playersId:Array.isArray(obj.playerIds)?obj.playerIds:Array.isArray(obj.svincolatiId)?obj.svincolatiId:null;
      if(ids)free=ids.map(id=>fromCatalog(maps.id.get(String(id)))).filter(Boolean);
      let arr=obj.players||obj.svincolati||obj.freeAgents||obj.availablePlayers;
      if(Array.isArray(arr))for(const x of arr){if(typeof x==='number'||typeof x==='string'&&/^\d+$/.test(x))free.push(fromCatalog(maps.id.get(String(x))));else if(typeof x==='string')free.push(fromCatalog(maps.name.get(norm(x)))||((typeof PLAYERS!=='undefined'?PLAYERS:[]).find(p=>norm(p.name)===norm(x))));else if(x&&typeof x==='object'){const c=x.id?maps.id.get(String(x.id)):maps.name.get(norm(x.name||x.nome||''));free.push(fromCatalog(c)||{role:roleOf(x.role||x.position)||'C',name:clean(x.name||x.nome),team:clean(x.team||x.squadra),q:num(x.q||x.qt),fvm:num(x.fvm)})}}
      if(Array.isArray(obj)&&!free.length){for(const x of obj){if(x?.id&&maps.id.has(String(x.id)))free.push(fromCatalog(maps.id.get(String(x.id))));else if(x?.name)free.push(fromCatalog(maps.name.get(norm(x.name))))}}
    }else if(rows.length){
      teams=teamsFromRows(rows);
      for(const r of rows){const idv=r.id||r.id_giocatore||r.idgiocatore||r.playerid;const name=r.giocatore||r.player||r.nome_giocatore||r.nomegiocatore||(!r.crediti&&!r.budget?r.nome:'');if(idv&&maps.id.has(String(idv)))free.push(fromCatalog(maps.id.get(String(idv))));else if(name){const c=maps.name.get(norm(name));if(c)free.push(fromCatalog(c));else{const lp=(typeof PLAYERS!=='undefined'?PLAYERS:[]).find(p=>norm(p.name)===norm(name));if(lp)free.push(livePlayer(lp))}}
      }
    }
    free=free.filter(Boolean).filter(p=>p.name);const uniqMap=new Map();free.forEach(p=>uniqMap.set(repairKey(p),p));free=[...uniqMap.values()];
    if(kind==='free'){
      if(!free.length)alert('Nel file non ho trovato giocatori svincolati riconoscibili. Se è un formato particolare mandamelo e aggiungo il parser.');else{repair.freeAgents=free;repair.sourceName=file.name;repair.transactions=[]}
      if(teams.length)mergeImportedTeams(teams);
    }else{
      if(teams.length)mergeImportedTeams(teams);else alert('Nel file non ho trovato nomi squadra + crediti residui. Puoi inserirli manualmente da “Squadre”.');
      if(free.length&&!repair.freeAgents.length){repair.freeAgents=free;repair.sourceName=file.name}
    }
    saveRepair();
  }
  function mergeImportedTeams(teams){
    const oldMine=mine()?.name||'';repair.teams=teams.map((t,i)=>({...t,id:t.id||'t'+(i+1),mine:oldMine?norm(t.name)===norm(oldMine):i===0}));if(!repair.teams.some(t=>t.mine)&&repair.teams[0])repair.teams[0].mine=true;
  }
  $r('importFreeBtn').onclick=()=> $r('repairFreeFile').click();$r('importCreditsBtn').onclick=()=> $r('repairCreditsFile').click();
  $r('repairFreeFile').onchange=async e=>{try{await importFile(e.target.files[0],'free')}catch(err){alert('Errore importazione: '+err.message)}e.target.value=''};
  $r('repairCreditsFile').onchange=async e=>{try{await importFile(e.target.files[0],'credits')}catch(err){alert('Errore importazione: '+err.message)}e.target.value=''};
  $r('repairSearch').oninput=renderRepair;$r('repairClear').onclick=()=>{$r('repairSearch').value='';renderRepair()};
  document.querySelectorAll('#repairChips [data-rf]').forEach(b=>b.onclick=()=>{repair.filter=b.dataset.rf;document.querySelectorAll('#repairChips [data-rf]').forEach(x=>x.classList.toggle('active',x===b));saveRepair()});

  const mode=localStorage.getItem(MODEKEY)==='repair'?'repair':'auction';switchMode(mode);
  renderRepair();
  window.addEventListener('load',()=>{setTimeout(renderRepair,900);setTimeout(renderRepair,2200)});
})();
