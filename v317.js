/* Fanta Live 3.1.7 — import squadre da qualunque link Leghe + fix etichetta infortunati */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const REPAIR_KEY='fantaRepairV1';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function readRepair(){
    try{return JSON.parse(localStorage.getItem(REPAIR_KEY)||'null')||{teams:[],freeAgents:[],transactions:[]}}
    catch(e){return{teams:[],freeAgents:[],transactions:[]}}
  }
  function writeRepair(s){localStorage.setItem(REPAIR_KEY,JSON.stringify(s))}

  function slugFromAnyLeagueLink(raw){
    let text=String(raw||'').trim();
    if(!text)throw new Error('Incolla un link qualsiasi della tua lega.');
    if(!/^https?:\/\//i.test(text))text='https://'+text.replace(/^\/+/, '');
    const u=new URL(text);
    if(!/(^|\.)leghe\.fantacalcio\.it$/i.test(u.hostname))throw new Error('Il link deve essere di leghe.fantacalcio.it.');
    const parts=u.pathname.split('/').filter(Boolean);
    if(!parts.length)throw new Error('Apri prima una pagina della tua lega, poi copia quel link.');
    const slug=parts[0];
    if(!slug)throw new Error('Non riesco a riconoscere il nome della lega dal link.');
    return {slug,base:`https://leghe.fantacalcio.it/${slug}`};
  }

  async function jina(url){
    const clean=String(url).replace(/^https?:\/\//,'');
    const r=await fetch('https://r.jina.ai/http://'+clean,{cache:'no-store'});
    if(!r.ok)throw new Error('Pagina Leghe non leggibile (HTTP '+r.status+').');
    return await r.text();
  }

  function parseTeamsText(text){
    text=String(text||'');
    const teams=[];
    const seen=new Set();
    const add=(name,credits)=>{
      name=String(name||'').replace(/^#+\s*/,'').trim();
      if(!name||/^(squadre|divisione\b|campionato\b|classifica\b|lega\b)/i.test(name))return;
      const k=norm(name);if(!k||seen.has(k))return;
      seen.add(k);teams.push({name,credits:Math.max(0,Math.round(+credits||0))});
    };

    /* Primo tentativo: per ogni budget cerca il titolo markdown più vicino sopra. */
    const budgetRe=/(\d+)\s+Budget disponibile/gi;
    let m;
    while((m=budgetRe.exec(text))){
      const before=text.slice(Math.max(0,m.index-500),m.index);
      const hs=[...before.matchAll(/#{3,6}\s*([^\n#]+)/g)];
      if(hs.length){add(hs[hs.length-1][1],Number(m[1]));continue}

      /* Fallback sul testo semplice: risale poche righe evitando etichette tecniche. */
      const lines=before.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
      let name='';
      for(let i=lines.length-1;i>=0&&i>=lines.length-8;i--){
        const line=lines[i].replace(/^[-*]\s*/, '').trim();
        if(!line||/Budget disponibile|^Divisione\b|^Image$|^Squadre$|^Campionato\b|^Impostazioni\b/i.test(line))continue;
        if(/^#{1,6}\s*/.test(line)){name=line.replace(/^#{1,6}\s*/,'');break}
        if(line.length>=2&&line.length<=80){name=line;break}
      }
      if(name)add(name,Number(m[1]));
    }

    /* Vecchio layout: nomi in heading e budget in elenco separato. */
    if(!teams.length){
      const budgets=[...text.matchAll(/(\d+)\s+Budget disponibile/gi)].map(x=>Number(x[1]));
      const names=[];
      for(const h of text.matchAll(/Divisione\s+[^\n]+\n+#{3,6}\s*([^\n#]+)/gi)){
        const n=String(h[1]||'').trim();if(n&&!names.some(x=>norm(x)===norm(n)))names.push(n);
      }
      if(budgets.length&&names.length>=budgets.length)for(let i=0;i<budgets.length;i++)add(names[i],budgets[i]);
    }
    return teams;
  }

  function saveTeams(teams,slug){
    if(!Array.isArray(teams)||teams.length<2)throw new Error('Non trovo abbastanza squadre nella pagina.');
    const s=readRepair(),oldMine=s.teams?.find(t=>t.mine)?.name||'';
    s.teams=teams.map((t,i)=>({
      id:'link'+(i+1),
      name:t.name,
      credits:Math.max(0,Math.round(+t.credits||0)),
      mine:oldMine?norm(t.name)===norm(oldMine):i===0
    }));
    if(!s.teams.some(t=>t.mine)&&s.teams[0])s.teams[0].mine=true;
    s.leagueSize=s.teams.length;
    s.leagueName=slug;
    s.sourceName=`Leghe · ${slug} · link`;
    s.version=11;
    writeRepair(s);
    localStorage.setItem('fantaModeV2','repair');
  }

  async function importAnyLink(raw,status){
    const {slug,base}=slugFromAnyLeagueLink(raw);
    status.textContent='Cerco automaticamente squadre e crediti…';
    let text='';
    let lastErr=null;
    for(const url of [`${base}/squadre`,`${base}/squadre?all=true`,base]){
      try{
        text=await jina(url);
        const teams=parseTeamsText(text);
        if(teams.length>=2){
          saveTeams(teams,slug);
          status.textContent=`✓ Importate ${teams.length} squadre con i crediti. Non serviva /squadre nel link copiato.`;
          setTimeout(()=>location.reload(),650);
          return;
        }
      }catch(e){lastErr=e}
    }
    throw new Error(lastErr?.message||'Non riesco a leggere squadre e crediti. Se la lega è privata usa “Fanta Live Import” qui sotto: funziona dalla sessione già autenticata.');
  }

  function enhanceImporter(){
    const modal=$('directLegheModal');if(!modal||modal.dataset.v317==='1')return;
    modal.dataset.v317='1';
    const sheet=modal.querySelector('.direct-leghe-sheet')||modal.querySelector('.repair-sheet');if(!sheet)return;
    const steps=sheet.querySelector('.direct-steps');
    const box=document.createElement('div');box.className='quick-link-import-v317';
    box.innerHTML=`<div class="quick-link-title-v317">Metodo più semplice</div>
      <div class="quick-link-copy-v317">Copia <b>qualunque URL</b> mentre sei dentro la tua lega: home, mercato, classifica, formazione… non deve finire con <b>/squadre</b>.</div>
      <div class="quick-link-row-v317"><input id="anyLeagueUrlV317" type="url" inputmode="url" placeholder="Incolla un qualsiasi link Leghe"><button id="pasteLeagueUrlV317" type="button">📋 Incolla</button></div>
      <button class="repair-confirm quick-link-go-v317" id="importAnyLeagueUrlV317" type="button">Importa squadre e crediti</button>
      <div class="quick-link-hint-v317">Se la lega è privata o il sito non espone i crediti pubblicamente, usa il metodo completo “Fanta Live Import” subito sotto.</div>`;
    if(steps)steps.insertAdjacentElement('beforebegin',box);else sheet.querySelector('.repair-help')?.insertAdjacentElement('afterend',box);

    const input=$('anyLeagueUrlV317'),status=$('directStatus');
    $('pasteLeagueUrlV317').onclick=async()=>{
      try{input.value=await navigator.clipboard.readText();await importAnyLink(input.value,status)}
      catch(e){if(!input.value){const v=prompt('Incolla un qualsiasi link della tua lega:','');if(v)input.value=v}if(input.value)importAnyLink(input.value,status).catch(err=>status.textContent='Errore: '+err.message);else status.textContent='Nessun link incollato.'}
    };
    $('importAnyLeagueUrlV317').onclick=()=>importAnyLink(input.value,status).catch(e=>status.textContent='Errore: '+e.message);

    const h=modal.querySelector('.leghe-import-head h3');if(h)h.textContent='Importa la tua lega';
    const p=modal.querySelector('.repair-help');if(p)p.innerHTML='Prova prima il metodo rapido con <b>un qualsiasi link della lega</b>. Se non basta, il preferito <b>Fanta Live Import</b> legge direttamente la sessione autenticata e importa anche rose e svincolati.';
  }

  function forceInjuryLabels(root=document){
    const nodes=root.querySelectorAll?root.querySelectorAll('.tag.inj'):[];
    nodes.forEach(el=>{
      const txt=(el.textContent||'').trim().toUpperCase();
      if(txt!=='🔴 INFORTUNATO')el.textContent='🔴 INFORTUNATO';
      el.setAttribute('aria-label','Infortunato');
    });
  }

  function bind(){
    const version=document.querySelector('.aboutTitle span');if(version)version.textContent='Versione pubblica 3.1.7 · Liquid Glass';
    forceInjuryLabels();
    new MutationObserver(muts=>{
      let need=false;for(const m of muts)if(m.addedNodes?.length||m.type==='characterData'){need=true;break}
      if(need)requestAnimationFrame(()=>forceInjuryLabels());
    }).observe(document.body,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#importDirectLeagueBtn,#importLeagueBtn,#importCreditsBtn'))setTimeout(enhanceImporter,60);
    });
    setTimeout(enhanceImporter,700);setTimeout(enhanceImporter,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
