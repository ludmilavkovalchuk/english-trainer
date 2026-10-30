// Работает и в подпапке репозитория на GitHub Pages: все пути относительные.
const CACHE = "english-trainer-github-october-v1";
const ASSETS = ["./", "./index.html", "./style.css", "./app.js", "./lessons.json", "./manifest.webmanifest", "./bear-reading.webp", "./bear-stars.webp", "./bear-hurray.webp", "./bear-oops.webp", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./icon-apple-180.png", "./favicon.png", "./scene-along.webp", "./scene-dungeon.webp", "./scene-coincidence.webp", "./scene-under-the-weather.webp", "./scene-call-it-a-day.webp", "./scene-nudge.webp", "./scene-think-outside-the-box.webp", "./scene-beyond.webp", "./scene-whimsy.webp", "./scene-wary.webp"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("english-trainer-") && key !== CACHE).map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, clone)));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
