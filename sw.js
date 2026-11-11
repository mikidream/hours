const V='hours-v6';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='shared').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // a screenshot shared from another app
  if(e.request.method==='POST'&&url.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{const fd=await e.request.formData();const f=fd.get('image');
        if(f){const c=await caches.open('shared');await c.put('shared-image',new Response(f,{headers:{'Content-Type':f.type||'image/png'}}))}
      }catch(err){}
      return Response.redirect('./?shared=1',303);
    })());
    return;
  }
  if(e.request.method!=='GET')return;
  const heavy=url.pathname.includes('/vendor/')||url.hostname.includes('fonts.g');
  if(heavy){ // cache first: large files that never change
    e.respondWith(caches.open(V).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok||n.type==='opaque')c.put(e.request,n.clone());return n}))));
  }else if(url.origin===location.origin){ // network first, so updates arrive; cache when offline
    e.respondWith(fetch(e.request).then(n=>{if(n.ok){const cp=n.clone();caches.open(V).then(c=>c.put(e.request,cp))}return n})
      .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./'))));
  }
});
