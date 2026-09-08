const DEF={budget:500,teams:8,slots:{P:3,D:8,C:8,A:6}};
let cfg=JSON.parse(localStorage.getItem('fantaCfgV5')||'null')||structuredClone(DEF);
let state=JSON.parse(localStorage.getItem('fantaStateV5')||'null')||{credits:cfg.budget,owned:{},sold:{},custom:[],history:[]};
if(!Array.isArray(state.history)) state.history=[];
let PLAYERS=[],filter='ALL',selected=null;
const $=id=>document.getElementById(id);
const ORDER={P:0,D:1,C:2,A:3};
const PEN={Atalanta:['Scamacca','Raspadori','Samardzic'],Bologna:['Orsolini','Bernardeschi'],Inter:['Calhanoglu','Zielinski','Dimarco'],Juventus:['Kolo Muani','Woltemade','Yildiz'],Milan:['Pulisic','Modric','Ramos G.'],Napoli:['De Bruyne','Hojlund','McTominay'],Roma:['Malen','Dybala','Soulè'],Udinese:['Davis K.','Solet'],Como:['Da Cunha','Kean','Paz N.'],Torino:['Vlasic','Simeone'],Sassuolo:['Berardi','Laurientè']};
const INJ={'Orsolini':{sev:'medium',txt:'Problema muscolare: rientro indicativo a fine settembre.'},'McTominay':{sev:'medium',txt:'Stop fisico: rientro stimato a ottobre.'},'Yildiz':{sev:'long',txt:'Frattura al piede: stop lungo, rientro da rivalutare.'},'Buongiorno':{sev:'long',txt:'Problema al ginocchio: stop lungo.'},'Zaniolo':{sev:'medium',txt:'Lesione muscolare: rientro indicativo a fine settembre.'},'Hien':{sev:'medium',txt:'Lesione muscolare: rientro previsto a ottobre.'},'Pessina':{sev:'long',txt:'Problema al ginocchio: rientro indicativo da novembre.'},'Solet':{sev:'short',txt:'Noie muscolari: indisponibilità breve.'}};
const DOUBT={'Dimarco':'Condizioni da monitorare prima del prossimo turno.','Mina':'Condizioni da valutare.','Cambiaso':'Fastidio fisico: in dubbio.'};

function season(){let d=new Date(),y=d.getFullYear(),m=d.getMonth()+1;return m>=7?`${y}/${String(y+1).slice(2)}`:`${y-1}/${String(y).slice(2)}`}
function norm(s){return(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function cleanMd(s){return(s||'').replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`*_>#]/g,'').trim()}
function key(p){return p.name+'|'+p.role}
function all(){return PLAYERS}
function st(p){return state.owned[key(p)]?'owned':state.sold[key(p)]?'sold':'available'}
function owned(r){return Object.values(state.owned).filter(x=>x.role===r)}
function left(r){return Math.max(0,cfg.slots[r]-owned(r).length)}
function leftAll(){return Object.keys(cfg.slots).reduce((n,r)=>n+left(r),0)}
function spent(r){return owned(r).reduce((n,x)=>n+x.price,0)}
function baseBudget(){let b=cfg.budget,P=Math.round(b*.076),D=Math.round(b*.164),C=Math.round(b*.206);return{P,D,C,A:b-P-D-C}}
function rawCap(p){let f=+p.fvm||0;if(p.role==='P')return f>=75?40:f>=60?35:f>=48?31:f>=32?20:f>=20?12:f>=10?6:2;if(p.role==='D')return f>=180?35:f>=80?28:f>=55?23:f>=40?18:f>=28?14:f>=18?10:f>=10?6:3;if(p.role==='C')return f>=220?50:f>=170?43:f>=120?36:f>=80?29:f>=55?23:f>=38?18:f>=25?13:f>=15?9:f>=8?5:3;return f>=400?155:f>=330?145:f>=250?125:f>=210?112:f>=170?100:f>=130?86:f>=100?72:f>=75?58:f>=50?43:f>=30?30:f>=18?20:f>=10?12:5}
function health(p){if(INJ[p.name])return{type:'inj',...INJ[p.name]};if(DOUBT[p.name])return{type:'doubt',txt:DOUBT[p.name]};return null}
function refCap(p){let c=Math.round(rawCap(p)*(cfg.budget/500)),h=health(p);if(h?.type==='inj')c=Math.round(c*(h.sev==='long'?.65:h.sev==='medium'?.82:.92));if(h?.type==='doubt')c=Math.round(c*.95);let ps=PEN[p.team]||[],i=ps.indexOf(p.name);if(i===0&&!INJ[p.name])c+=p.role==='A'?5:p.role==='C'?3:1;return Math.max(1,c)}
function delta(){return Math.round(Object.values(state.owned).reduce((n,x)=>n+refCap(x)-x.price,0))}
function weights(){let w={P:.05,D:.18,C:.25,A:.52},s=0;for(let r in w){if(left(r))s+=w[r];else w[r]=0}for(let r in w)w[r]=s?w[r]/s:0;return w}
function boost(r){let w=weights();return left(r)?Math.round((delta()*w[r])/Math.max(1,Math.min(left(r),3))):0}
function maxSpend(){return Math.max(1,state.credits-Math.max(0,leftAll()-1))}
function cap(p){let b=baseBudget(),c=Math.min(refCap(p)+boost(p.role),maxSpend()),room=Math.max(1,b[p.role]-spent(p.role)+Math.max(0,boost(p.role))*Math.max(1,left(p.role)));if(left(p.role)>1)c=Math.min(c,Math.max(1,room-(left(p.role)-1)));return Math.max(1,Math.round(c))}
function save(){localStorage.setItem('fantaStateV5',JSON.stringify(state));render()}
function hist(){state.history.push(JSON.stringify({credits:state.credits,owned:state.owned,sold:state.sold,custom:state.custom||[]}));if(state.history.length>20)state.history.shift()}

function normalizePlayer(p){return{...p,name:cleanMd(p.name),team:cleanMd(p.team),alias:cleanMd(p.alias||''),photo:p.photo||''}}
function parseCSV(t){let rows=t.trim().split(/\r?\n/),a=[];for(let i=1;i<rows.length;i++){let c=rows[i].split(',');if(c.length>=5)a.push(normalizePlayer({role:c[0],name:c[1],team:c[2],q:+c[3],fvm:+c[4],alias:c.slice(5).join(',')}))}return a}

function seasonRefresh(){let k='listSeasonV6',old=localStorage.getItem(k),now=season();if(old&&old!==now){localStorage.removeItem('playersV6');localStorage.removeItem('fcMeta_'+old)}localStorage.setItem(k,now)}
async function loadPlayers(){try{let r=await fetch('players.csv?d='+new Date().toISOString().slice(0,10),{cache:'no-store'});if(!r.ok)throw 0;PLAYERS=parseCSV(await r.text());localStorage.setItem('playersV6',JSON.stringify(PLAYERS));$('loadState').textContent=`✓ ${PLAYERS.length} giocatori`;}catch(e){PLAYERS=JSON.parse(localStorage.getItem('playersV6')||'[]').map(normalizePlayer);$('loadState').textContent=PLAYERS.length?`⚠ ${PLAYERS.length} dalla cache`:'Errore listone';}render();loadOfficialPhotos()}

function applyMeta(meta){let n=0;PLAYERS=PLAYERS.map(p=>{let m=meta[norm(p.name)]||meta[norm(p.alias)];if(!m)return p;n++;return{...p,fcId:m.id,profileUrl:m.url,photo:`https://content.fantacalcio.it/web/campioncini/21/card/${m.id}.png`}});return n}
async function loadOfficialPhotos(){
  let ck='fcMeta_'+season(),cached=JSON.parse(localStorage.getItem(ck)||'null');
  if(cached){let n=applyMeta(cached);if(n){$('photoState').textContent=`${n} campioncini`;render()}}
  try{
    let r=await fetch('https://r.jina.ai/https://www.fantacalcio.it/quotazioni-fantacalcio',{cache:'no-store'});if(!r.ok)throw 0;
    let t=await r.text(),meta={},re=/\[([^\]\n]{1,80})\]\((https:\/\/www\.fantacalcio\.it\/[^)\s]*(?:squadre|serie-a)[^)\s]*)\)/gi,m;
    while((m=re.exec(t))){let id=(m[2].match(/\/(\d+)(?:\/)?$/)||[])[1];if(id)meta[norm(cleanMd(m[1]))]={id,url:m[2]}}
    if(Object.keys(meta).length){localStorage.setItem(ck,JSON.stringify(meta));let n=applyMeta(meta);$('photoState').textContent=`${n} campioncini`;render()}
  }catch(e){if(!$('photoState').textContent)$('photoState').textContent='foto non disponibili'}
}

function roleClass(r){return r.toLowerCase()}
function img(p,big=false){
  if(!p.photo)return `<div class="fallback">${p.role}</div>`;
  return `<img src="${p.photo}" referrerpolicy="no-referrer" alt="${p.name}" onerror="this.outerHTML='<div class=&quot;fallback&quot;>${p.role}</div>'"><span class="roleDot">${p.role}</span>`;
}
function tags(p){let a=[],h=health(p),ps=PEN[p.team]||[],i=ps.indexOf(p.name);if(h?.type==='inj')a.push('<span class="tag inj">🔴 INFORTUNATO</span>');if(h?.type==='doubt')a.push('<span class="tag doubt">🟠 DUBBIO</span>');if(i>=0)a.push(`<span class="tag pen">🎯 RIGORI #${i+1}</span>`);return a.join('')}
function filtered(){
  let q=norm($('search').value),terms=q.split(/\s+/).filter(Boolean),a=all().filter(p=>terms.every(t=>norm(`${p.name} ${p.alias||''} ${p.team}`).includes(t)));
  if('PDCA'.includes(filter)&&filter.length===1)a=a.filter(p=>p.role===filter);
  if(filter==='INJ')a=a.filter(p=>health(p)?.type==='inj');
  if(filter==='AVAILABLE')a=a.filter(p=>st(p)==='available');
  if(filter==='OWNED')a=a.filter(p=>st(p)==='owned');
  if(filter==='OWNED')a.sort((x,y)=>ORDER[x.role]-ORDER[y.role]||(+state.owned[key(y)]?.price||0)-(+state.owned[key(x)]?.price||0)||norm(x.name).localeCompare(norm(y.name)));
  else a.sort((x,y)=>(st(x)==='available'?0:1)-(st(y)==='available'?0:1)||(y.fvm||0)-(x.fvm||0));
  return a.slice(0,q?100:120)
}

function render(){
  let b=baseBudget(),d=delta(),total=Object.values(cfg.slots).reduce((a,b)=>a+b,0);
  $('headerSub').textContent=`${cfg.teams} squadre • ${cfg.budget} crediti • ${total} giocatori • ${season()}`;
  $('credits').textContent=state.credits;$('slots').textContent=leftAll();$('reserve').textContent=leftAll();
  $('delta').textContent=d?`${d>0?'+':''}${d} vs tetti`:'Strategia in equilibrio';$('delta').className=d>0?'good':d<0?'bad':'';
  $('roles').innerHTML='PDCA'.split('').map(r=>`<div class="role ${roleClass(r)}"><b>${r} ${cfg.slots[r]-left(r)}/${cfg.slots[r]}</b><small>${spent(r)} spesi • target ${b[r]}</small><div class="bar"><i style="width:${Math.min(100,spent(r)/Math.max(1,b[r])*100)}%"></i></div></div>`).join('');
  $('strategy').innerHTML=Object.keys(state.owned).length?(d>=0?`<strong style="color:var(--green)">Margine ${d>=0?'+':''}${d}</strong> rispetto ai tetti. I massimali vengono riallocati automaticamente.`:`<strong style="color:var(--red)">${d} crediti</strong> rispetto alla strategia: i prossimi tetti sono già stati ridotti.`):`<strong style="color:var(--yellow)">Piano base:</strong> P ${b.P} • D ${b.D} • C ${b.C} • A ${b.A}.`;

  let a=filtered();$('count').textContent=`${a.length} mostrati • ${all().length} totali`;
  $('results').innerHTML=a.length?a.map(p=>`<div class="player ${roleClass(p.role)} ${st(p)}" data-k="${encodeURIComponent(key(p))}"><div class="photo" style="--role:var(--${p.role})">${img(p)}</div><div><div class="name">${p.name}</div><div class="meta">${p.team} • Qt ${p.q} • FVM ${p.fvm}</div><div class="tags">${tags(p)}</div></div><div class="price"><b>${st(p)==='owned'?state.owned[key(p)].price:cap(p)}</b><small>${st(p)==='owned'?'PAGATO':st(p)==='sold'?'USCITO':'MAX ORA'}</small></div></div>`).join(''):'<div class="empty">Nessun giocatore trovato.</div>';
  document.querySelectorAll('.player').forEach(el=>el.onclick=()=>{selected=all().find(p=>key(p)===decodeURIComponent(el.dataset.k));if(selected)openPlayer(selected)});

  renderRoster();
}

function renderRoster(){
  let ro=Object.values(state.owned);
  $('rosterCount').textContent=ro.length?`${ro.length} acquistati`:'';
  if(!ro.length){$('roster').innerHTML='<div class="empty">Ancora nessun acquisto.</div>';return}
  let html=[];
  for(let r of ['P','D','C','A']){
    let group=ro.filter(x=>x.role===r).sort((x,y)=>y.price-x.price||norm(x.name).localeCompare(norm(y.name)));
    if(!group.length)continue;
    html.push(`<div class="roleGroup"><div class="roleGroupHead ${roleClass(r)}"><b>${r}</b><small>${group.length} giocatori • ${group.reduce((n,x)=>n+x.price,0)} cr</small></div>${group.map(x=>`<div class="roster-row ${roleClass(r)}"><div><div class="name">${x.name}</div><div class="meta">${x.team}</div></div><div class="rosterPrice"><b>${x.price}</b><button data-del="${encodeURIComponent(key(x))}">×</button></div></div>`).join('')}</div>`)
  }
  $('roster').innerHTML=html.join('');
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{let k=decodeURIComponent(b.dataset.del);if(confirm('Rimuovere questo acquisto?')){hist();state.credits+=state.owned[k].price;delete state.owned[k];save()}})
}

function profile(p){let c=refCap(p);if(p.role==='P')return c>=30?'Portiere premium: affidabilità, clean sheet e continuità da primo slot.':'Portiere da gestione: valore soprattutto in rapporto a prezzo e calendario.';if(p.role==='D')return c>=24?'Difensore premium: ottimo per modificatore, titolarità e potenziale bonus offensivo.':'Difensore da rotazione: priorità a titolarità, voto e rapporto qualità/prezzo.';if(p.role==='C')return c>=35?'Centrocampista di prima fascia: bonus, inserimenti e possibile peso sui piazzati.':'Centrocampista utile: titolarità e upside, da prendere senza forzare il prezzo.';return c>=90?'Attaccante top: potenziale da trascinatore, ma va inseguito solo entro l’hard stop.':'Attaccante da reparto: valore legato a titolarità e continuità realizzativa.'}
function alternatives(p){return all().filter(x=>x.role===p.role&&st(x)==='available'&&key(x)!==key(p)).map(x=>({...x,dist:Math.abs((x.fvm||0)-(p.fvm||0))})).sort((a,b)=>a.dist-b.dist||(b.fvm||0)-(a.fvm||0)).slice(0,3)}
function openPlayer(p){
  let h=health(p),c=cap(p),s=st(p);
  $('pn').textContent=p.name;$('pm').textContent=`${p.role} • ${p.team} • Qt ${p.q} • FVM ${p.fvm}`;$('ptags').innerHTML=tags(p);$('pc').textContent=c;
  $('modalPhoto').style.setProperty('--role',`var(--${p.role})`);$('modalPhoto').innerHTML=img(p,true);
  let sig=s!=='available'?(s==='owned'?'GIÀ TUO':'GIÀ USCITO'):h?.type==='inj'&&h.sev==='long'?'ROSSO • rischio alto':h||boost(p.role)<0?'GIALLO • attenzione':'VERDE • puoi andare';
  $('signal').textContent=sig;$('signal').className='signal '+(sig.startsWith('VERDE')?'green':sig.startsWith('ROSSO')||sig.startsWith('GIÀ')?'red':'yellow');
  $('profile').innerHTML=`<strong>⚡ Profilo tecnico</strong><br>${profile(p)}`;
  $('health').innerHTML=h?`<strong>${h.type==='inj'?'🔴 Infortunato':'🟠 In dubbio'}</strong><br>${h.txt}`:'<strong style="color:var(--green)">● Nessun infortunio segnalato</strong>';
  $('why1').textContent=`Tetto base ${refCap(p)} → delta reparto ${boost(p.role)>=0?'+':''}${boost(p.role)}`;
  $('why2').textContent=`Hard stop finale: ${c}. Devi lasciare almeno ${Math.max(0,leftAll()-1)} crediti per gli altri slot.`;
  $('price').value='';
  $('alts').innerHTML=alternatives(p).map(a=>`<div class="alt"><b>${a.name}</b>${a.team}<br>max <strong style="color:white">${cap(a)}</strong></div>`).join('');
  $('playerModal').classList.add('show')
}

function closePlayer(){$('playerModal').classList.remove('show')}
function openSettings(){
  $('cfgBudget').value=cfg.budget;$('cfgTeams').value=cfg.teams;$('cfgP').value=cfg.slots.P;$('cfgD').value=cfg.slots.D;$('cfgC').value=cfg.slots.C;$('cfgA').value=cfg.slots.A;$('settingsModal').classList.add('show')
}
function closeSettings(){$('settingsModal').classList.remove('show')}

$('buyBtn').onclick=()=>{if(!selected)return;let price=parseInt($('price').value);if(!price||price<1)return alert('Inserisci il prezzo.');if(left(selected.role)<=0)return alert('Hai già completato questo ruolo.');if(price>maxSpend())return alert('Così non rimane almeno 1 credito per ogni slot vuoto.');hist();state.owned[key(selected)]={...selected,price,capAtBuy:cap(selected)};delete state.sold[key(selected)];state.credits-=price;save();closePlayer()};
$('otherBtn').onclick=()=>{if(!selected)return;if(state.owned[key(selected)])return alert('È già nella tua rosa.');hist();state.sold[key(selected)]=true;save();closePlayer()};
$('closePlayer').onclick=closePlayer;$('playerModal').onclick=e=>{if(e.target===$('playerModal'))closePlayer()};
$('search').oninput=render;$('clear').onclick=()=>{$('search').value='';render();$('search').focus()};
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.f;render()});

$('undoBtn').onclick=()=>{if(!state.history.length)return;let prev=JSON.parse(state.history.pop());state.credits=prev.credits;state.owned=prev.owned;state.sold=prev.sold;state.custom=prev.custom||[];save()};
$('settingsBtn').onclick=openSettings;$('closeCfg').onclick=closeSettings;$('settingsModal').onclick=e=>{if(e.target===$('settingsModal'))closeSettings()};
$('saveCfg').onclick=()=>{let next={budget:Math.max(1,+$('cfgBudget').value||500),teams:Math.max(2,+$('cfgTeams').value||8),slots:{P:Math.max(1,+$('cfgP').value||3),D:Math.max(1,+$('cfgD').value||8),C:Math.max(1,+$('cfgC').value||8),A:Math.max(1,+$('cfgA').value||6)}};let changed=JSON.stringify(next)!==JSON.stringify(cfg);if(changed&&Object.keys(state.owned).length&&!confirm('Cambiare configurazione azzera l’asta corrente. Continuare?'))return;cfg=next;localStorage.setItem('fantaCfgV5',JSON.stringify(cfg));if(changed){state={credits:cfg.budget,owned:{},sold:{},custom:[],history:[]};localStorage.setItem('fantaStateV5',JSON.stringify(state))}closeSettings();render()};

$('backupBtn').onclick=()=>{let blob=new Blob([JSON.stringify({version:6,cfg,state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='FantaLive_backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{let data=JSON.parse(await f.text());if(!data.cfg||!data.state)throw 0;cfg=data.cfg;state=data.state;if(!Array.isArray(state.history))state.history=[];localStorage.setItem('fantaCfgV5',JSON.stringify(cfg));localStorage.setItem('fantaStateV5',JSON.stringify(state));closeSettings();render();alert('Backup importato.')}catch(err){alert('Backup non valido.')}finally{e.target.value=''}};
$('resetBtn').onclick=()=>{if(confirm('Azzerare completamente l’asta?')){state={credits:cfg.budget,owned:{},sold:{},custom:[],history:[]};save();closeSettings()}};

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
seasonRefresh();render();loadPlayers();
if(!localStorage.getItem('fantaConfiguredV6')){localStorage.setItem('fantaConfiguredV6','1');if(!localStorage.getItem('fantaCfgV5'))openSettings()}
