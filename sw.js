const CACHE='fanta-live-public-2.9.2';
const ASSETS=['./','./index.html','./style.css','./repair.css','./v2.css','./v22.css','./v23.css','./v231.css','./v24.css','./v25.css','./v26.css','./v27.css','./v28.css','./v29.css','./app.js','./photo-fix.js','./repair.js','./v22.js','./v23.js','./v231.js','./v26.js','./v27.js','./v28.js','./v29.js','./players.csv','./manifest.webmanifest','./apple-touch-icon.png','./apple-touch-icon-precomposed.png','./favicon.png','./assets/fanta-live-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  const sameOrigin=u.origin===location.origin;
  if(e.request.destination==='image'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
    return;
  }
  if(sameOrigin){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const cp=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp));
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});