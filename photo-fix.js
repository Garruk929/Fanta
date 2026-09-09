/* Fanta Live 1.0.14 — resilient player photo loader */
(function(){
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const tokens=s=>norm(s).split(' ').filter(Boolean);
  const compact=s=>{
    const out=[];
    for(const t of tokens(s)) if(t.length>1&&!out.includes(t)) out.push(t);
    return out.join(' ');
  };
  const variants=s=>{
    const n=norm(s); if(!n) return [];
    const p=tokens(s), noInitials=p.filter(x=>x.length>1).join(' ');
    const rev=p.length>1?[...p].reverse().join(' '):'';
    return uniq([n,noInitials,compact(s),rev]);
  };
  function buildMeta(rows){
    const byName={}, pools={};
    for(const x of rows||[]){
      if(!x||!x.id||!x.name) continue;
      const id=String(x.id);
      const direct=x.playerImage||`https://content.fantacalcio.it/web/campioncini/21/medium/${id}.png?v=640`;
      const medium=`https://content.fantacalcio.it/web/campioncini/21/medium/${id}.png?v=640`;
      const card=`https://content.fantacalcio.it/web/campioncini/21/card/${id}.png?v=642`;
      const m={id,name:x.name,team:x.team||'',role:x.position||'',photos:uniq([direct,medium,card])};
      for(const k of variants(x.name)) byName[k]=m;
      const pk=`${norm(x.team)}|${x.position||''}`;
      (pools[pk]||(pools[pk]=[])).push(m);
    }
    return {byName,pools};
  }
  function scoreName(a,b){
    const A=new Set(tokens(a).filter(x=>x.length>1)), B=new Set(tokens(b).filter(x=>x.length>1));
    if(!A.size||!B.size) return 0;
    let hit=0; for(const x of A) if(B.has(x)) hit++;
    return hit/Math.max(A.size,B.size);
  }
  function matchMeta(meta,p){
    const queries=uniq([p.name,p.alias,compact(p.name),compact(p.alias)]);
    for(const q of queries) for(const k of variants(q)) if(meta.byName[k]) return meta.byName[k];
    const pool=meta.pools[`${norm(p.team)}|${p.role}`]||[];
    let best=null,bestScore=0,second=0;
    for(const m of pool){
      const s=Math.max(...queries.map(q=>scoreName(q,m.name)));
      if(s>bestScore){second=bestScore;bestScore=s;best=m}else if(s>second)second=s;
    }
    return bestScore>=0.5 && (bestScore-second>=0.15 || bestScore>=0.99) ? best : null;
  }
  function applyMetaFixed(meta){
    PLAYERS=PLAYERS.map(p=>{
      const m=matchMeta(meta,p); if(!m) return p;
      const photos=uniq(m.photos||[]);
      return {...p,fcId:String(m.id||p.fcId||''),photo:photos[0]||p.photo||'',photoFallback:photos[1]||p.photoFallback||'',photoCandidates:uniq([...photos,...(p.photoCandidates||[]),p.photo,p.photoFallback])};
    });
    return PLAYERS.filter(p=>p.photo).length;
  }
  function jinaMeta(raw){
    const base=parseFantacalcioMeta(raw), rows=[];
    for(const [name,m] of Object.entries(base||{})) rows.push({id:m.id,name,team:'',position:'',playerImage:m.fallback||m.photo});
    const meta=buildMeta(rows);
    for(const [name,m] of Object.entries(base||{})){
      const mm=meta.byName[norm(name)];
      if(mm) mm.photos=uniq([m.fallback,m.photo,...mm.photos]);
    }
    return meta;
  }
  img=function(p){
    const candidates=uniq([...(p.photoCandidates||[]),p.photo,p.photoFallback]);
    if(!candidates.length) return `<div class="fallback">${p.role}</div>`;
    const src=escAttr(candidates[0]), rest=escAttr(JSON.stringify(candidates.slice(1))), alt=escAttr(p.name);
    return `<img src="${src}" data-next="${rest}" data-i="0" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="${alt}" onerror="let a=[];try{a=JSON.parse(this.dataset.next||'[]')}catch(e){};let i=+(this.dataset.i||0);if(i<a.length){this.dataset.i=String(i+1);this.src=a[i]}else{this.outerHTML='<div class=&quot;fallback&quot;>${p.role}</div>'}"><span class="roleDot">${p.role}</span>`;
  };
  loadOfficialPhotos=async function(){
    const ck='fcMetaV14_'+season();
    let loaded=PLAYERS.filter(p=>p.photo).length;
    try{
      const cached=JSON.parse(localStorage.getItem(ck)||'null');
      if(cached){loaded=applyMetaFixed(cached);$('photoState').textContent=`${loaded}/${PLAYERS.length} campioncini`;render();}
    }catch(e){}
    try{
      const r=await fetch('https://cdn.jsdelivr.net/gh/bqit/fantaleghe-api-json@main/players.json?v=14',{cache:'no-store'});
      if(!r.ok) throw new Error('photo source');
      const meta=buildMeta(await r.json());
      localStorage.setItem(ck,JSON.stringify(meta));
      loaded=applyMetaFixed(meta);
      $('photoState').textContent=`${loaded}/${PLAYERS.length} campioncini`;
      render();
    }catch(e){}
    try{
      const r=await fetch('https://r.jina.ai/https://www.fantacalcio.it/quotazioni-fantacalcio',{cache:'no-store'});
      if(r.ok){
        const meta=jinaMeta(await r.text());
        loaded=applyMetaFixed(meta);
        $('photoState').textContent=`${loaded}/${PLAYERS.length} campioncini`;
        render();
      }
    }catch(e){}
    if(!loaded) $('photoState').textContent='foto non disponibili';
  };
  try{localStorage.removeItem('fcMetaV9_'+season())}catch(e){}
  loadOfficialPhotos();
  setTimeout(()=>loadOfficialPhotos(),1400);
})();

/* Bootstrap delle rifiniture 2.3.x: l'index storico continua a caricare photo-fix.js,
   quindi usiamo questo punto stabile per applicare sempre la UI più recente. */
window.addEventListener('load',()=>{
  const load=src=>new Promise((resolve,reject)=>{
    if(document.querySelector(`script[src^="${src}"]`)) return resolve();
    const s=document.createElement('script');s.src=src+'?v=231';s.onload=resolve;s.onerror=reject;document.body.appendChild(s);
  });
  load('v23.js').then(()=>load('v231.js')).catch(()=>{});
});
