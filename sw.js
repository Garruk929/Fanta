const CACHE='fanta-live-public-1.0.8';
const ASSETS=['./','./index.html','./style.css','./app.js','./players.csv','./manifest.webmanifest','./assets/fanta-live-icon-v108.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  const sameOrigin=u.origin===location.origin;
  if(sameOrigin){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const cp=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp));
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
