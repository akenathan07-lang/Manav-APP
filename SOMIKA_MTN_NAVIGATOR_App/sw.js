const V='somika-mtn-v85';
const FILES=['./','./index.html','./config.js','./manifest.webmanifest','./icons/mark.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/badge-96.png','./icons/app-mark.png','./icons/vinmart.png','./icons/tg.png','./icons/tg1.png','./icons/tg2.png','./icons/tg3.png','./data/co-2001.js','./data/co-2002.js','./data/co-2003.js','./fonts/FiraSans-Regular.woff','./fonts/FiraSans-SemiBold.woff','./fonts/FiraSans-ExtraBold.woff'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const keep=(r,res)=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res};
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
  const path=new URL(r.url).pathname;
  // Logos, icons, fonts and training data never change within a version: the copy on the phone shows at once.
  if(/\/(icons|fonts|data)\//.test(path)){
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>keep(r,res))));return}
  // The app itself: the network first so updates arrive, but never more than 3 s of waiting when a copy is on the phone.
  e.respondWith(new Promise(done=>{let over=false;const end=x=>{if(!over&&x){over=true;done(x)}};
    const cached=caches.match(r,{ignoreSearch:true}).then(x=>x||(r.mode==='navigate'?caches.match('./index.html'):null));
    const t=setTimeout(()=>cached.then(end),3000);
    fetch(r).then(res=>{clearTimeout(t);end(keep(r,res))}).catch(()=>{clearTimeout(t);cached.then(x=>{if(x)end(x);else{over=true;done(Response.error())}})})}))});

// A tap on a notification opens the app on the page it is about.
self.addEventListener('notificationclick',e=>{e.notification.close();const d=e.notification.data||{},href=d.href||'';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if(c.url.startsWith(self.registration.scope)){c.postMessage({type:'pmn-open',href,key:d.key});return c.focus()}}
    return self.clients.openWindow(new URL('./'+(href||''),self.registration.scope).href)}))});
// Ready for server push (notifications that arrive even when the app is closed).
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'MTN Navigator',{body:d.body||'',tag:d.tag||undefined,icon:'./icons/icon-192.png',badge:'./icons/badge-96.png',data:{href:d.href||'',key:d.tag||''}}))});
