const VERSION = "bykevin-v3.0.0";
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
  try { const r = await fetch(req); if (r && r.ok) c.put(req, r.clone()); return r; }
  catch { const m = await c.match(req); if (m) return m; throw new Error("offline"); }
}
async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const m = await c.match(req);
  if (m) { fetch(req).then((r) => { if (r && r.ok) c.put(req, r.clone()); }).catch(() => {}); return m; }
  const r = await fetch(req); if (r && r.ok) c.put(req, r.clone()); return r;
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

/* Relaye une notification quand la page ne peut pas l'afficher elle-même (APK/TWA). */
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "SKIP_WAITING") { self.skipWaiting(); return; }
  if (d.type === "LOCAL_NOTIF") {
    e.waitUntil(self.registration.showNotification(d.title || "ByKevin", {
      body: d.body || "",
      icon: abs("./icons/icon-192.png"),
      badge: abs("./icons/icon-192.png"),
      tag: d.tag || "bykevin",
      requireInteraction: true,
      renotify: true,
      data: { url: abs("./?tab=access") },
      actions: [
        { action: "open", title: "Traiter la demande" },
        { action: "close", title: "Plus tard" }
      ]
    }));
  }
});

self.addEventListener("push", (e) => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch { p = { title: "ByKevin", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(p.title || "ByKevin — demande d'accès", {
    body: p.body || "Nouvelle demande à traiter",
    icon: abs("./icons/icon-192.png"),
    badge: abs("./icons/icon-192.png"),
    tag: p.tag || "bykevin-access",
    requireInteraction: true,
    renotify: true,
    data: { url: abs("./?tab=access") },
    actions: [{ action: "open", title: "Traiter" }, { action: "close", title: "Plus tard" }]
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "close") return;
  const target = (e.notification.data && e.notification.data.url) || abs("./?tab=access");
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of cs) {
      if ("focus" in c) { c.postMessage({ type: "NOTIF_CLICK" }); c.navigate(target); return c.focus(); }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "bykevin-poll") {
    e.waitUntil((async () => {
      const cs = await self.clients.matchAll({ type: "window" });
      cs.forEach((c) => c.postMessage({ type: "POLL" }));
    })());
  }
});
