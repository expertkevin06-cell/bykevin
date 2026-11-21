const VERSION = "bykevin-v2.0.0";
const PAGES = VERSION + "-pages";
const STATIC = VERSION + "-static";

const abs = (u) => new URL(u, self.location.href).href;

const ASSETS = [
  "./", "./index.html", "./migration.html", "./manifest.webmanifest",
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-192.png", "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
].map(abs);

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC);
    await Promise.allSettled(ASSETS.map((u) => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function networkFirst(req, name) {
  const c = await caches.open(name);
  try {
    const r = await fetch(req);
    if (r && r.ok) c.put(req, r.clone());
    return r;
  } catch {
    const m = await c.match(req);
    if (m) return m;
    throw new Error("offline");
  }
}

async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const m = await c.match(req);
  if (m) {
    fetch(req).then((r) => { if (r && r.ok) c.put(req, r.clone()); }).catch(() => {});
    return m;
  }
  const r = await fetch(req);
  if (r && r.ok) c.put(req, r.clone());
  return r;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.includes("/api/")) return;
  if (req.mode === "navigate") {
    e.respondWith(networkFirst(req, PAGES).catch(() => caches.match(abs("./index.html"))));
    return;
  }
  if (url.origin === self.location.origin) e.respondWith(cacheFirst(req, STATIC));
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of cs) { if ("focus" in c) { c.navigate(abs("./?tab=access")); return c.focus(); } }
    if (self.clients.openWindow) await self.clients.openWindow(abs("./?tab=access"));
  })());
});
