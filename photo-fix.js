/* Fanta Live 1.0.14 — resilient player photo loader */
(function(){
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const variants=s=>{
    const n=norm(s); if(!n) return [];
    const parts=n.split(' ').filter(Boolean);
    const noInitials=parts.filter(x=>x.length>1).join(' ');
    const rev=parts.length>1?[...parts].reverse().join(' '):'';
    return uniq([n,noInitials,rev]);
  };
  function buildMeta(rows){
    const meta={};
    for(const x of rows||[]){
      if(!x||!x.id||!x.name) continue;
      const id=String(x.id);
      const direct=x.playerImage||`https://content.fantacalcio.it/web/campioncini/21/medium/${id}.png?v=640`;
      const medium=`https://content.fantacalcio.it/web/campioncini/21/medium/${id}.png?v=640`;
      const card=`https://content.fantacalcio.it/web/campioncini/21/card/${id}.png?v=642`;
      const m={id,url:'',team:x.team||'',role:x.position||'',photos:uniq([direct,medium,card])};
      for(const k of variants(x.name)) meta[k]=m;
    }
    return meta;
  }
  function matchMeta(meta,p){
    for(const k of [...variants(p.name),...variants(p.alias)]) if(meta[k]) return meta[k];
    return null;
  }
  function applyMetaFixed(meta){
    let n=0;
    PLAYERS=PLAYERS.map(p=>{
      const m=matchMeta(meta,p); if(!m) return p;
      n++;
      const photos=uniq(m.photos||[]);
      return {...p,fcId:String(m.id||''),profileUrl:m.url||'',photo:photos[0]||'',photoFallback:photos[1]||'',photoCandidates:photos};
    });
    return n;
  }
  img=function(p){
    const candidates=uniq([...(p.photoCandidates||[]),p.photo,p.photoFallback]);
    if(!candidates.length) return `<div class="fallback">${p.role}</div>`;
    const src=escAttr(candidates[0]);
    const rest=escAttr(JSON.stringify(candidates.slice(1)));
    const alt=escAttr(p.name);
    return `<img src="${src}" data-next="${rest}" data-i="0" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="${alt}" onerror="let a=[];try{a=JSON.parse(this.dataset.next||'[]')}catch(e){};let i=+(this.dataset.i||0);if(i<a.length){this.dataset.i=String(i+1);this.src=a[i]}else{this.outerHTML='<div class=&quot;fallback&quot;>${p.role}</div>'}"><span class="roleDot">${p.role}</span>`;
  };
  loadOfficialPhotos=async function(){
    const ck='fcMetaV14_'+season();
    let loaded=0;
    try{
      const cached=JSON.parse(localStorage.getItem(ck)||'null');
      if(cached){loaded=applyMetaFixed(cached);if(loaded){$('photoState').textContent=`${loaded} campioncini`;render();}}
    }catch(e){}
    try{
      const r=await fetch(`https://cdn.jsdelivr.net/gh/bqit/fantaleghe-api-json@main/players.json?v=14`,{cache:'no-store'});
      if(!r.ok) throw new Error('photo source');
      const meta=buildMeta(await r.json());
      localStorage.setItem(ck,JSON.stringify(meta));
      loaded=applyMetaFixed(meta);
      $('photoState').textContent=loaded?`${loaded} campioncini`:'foto non abbinate';
      render();
      return;
    }catch(e){}
    if(!loaded) $('photoState').textContent='foto non disponibili';
  };
  try{localStorage.removeItem('fcMetaV9_'+season())}catch(e){}
  loadOfficialPhotos();
  setTimeout(()=>loadOfficialPhotos(),1200);
})();
