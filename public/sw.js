// Service worker — beží nezávisle od otvorenej appky/karty. Tri úlohy:
// 1) keď príde push správa zo servera, zobrazí ju ako notifikáciu v telefóne/PC
// 2) keď na ňu niekto klikne, otvorí (alebo prepne na už otvorenú) appku a
//    pošle jej presne to miesto, kam má doskočiť (appka si to prevezme sama
//    pri načítaní — cez "?notif=" v URL, appka to sama vyčistí z adresy).
// 3) appshell cache (Fáza 1 offline režimu) — appka sa spustí aj bez signálu,
//    ak ju telefón už predtým aspoň raz načítal online.
//
// skipWaiting/clients.claim — bez tohto by nová verzia service workera (napr.
// keď sa táto logika niekedy nabudúce upraví) čakala, kým človek úplne
// zavrie VŠETKY otvorené karty/appku, než by sa vôbec prevzala — dovtedy by
// ticho bežala tá stará verzia, čo o žiadnych zmenách nevie. Toto zaisťuje,
// že sa nová verzia ujme hneď.
//
// CACHE_VERSION sa bumpuje ručne spolu s APP_VERSION v App.jsx (pri každom
// vydaní appky) — inak by appka po vydaní novej verzie zostala niekomu
// natrvalo zaseknutá na starej cache aj keď má signál.
const CACHE_VERSION = "mateco-appshell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Appshell (vstupná stránka) sa nacachuje hneď pri inštalácii pod pevným
  // kľúčom (scope appky), nech je k dispozícii aj pri úplne prvom offline
  // štarte cez URL s iným query stringom (napr. "?notif=..." z notifikácie).
  event.waitUntil(
    fetch(self.registration.scope)
      .then((res) => caches.open(CACHE_VERSION).then((cache) => cache.put(self.registration.scope, res)))
      .catch(() => {})
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Stará appshell cache z predošlej verzie sa zahodí — nech sa nehromadí
      // a nech nová appka vždy vie, že jediná platná cache je CACHE_VERSION.
      caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)))),
    ])
  );
});

self.addEventListener("push", (event) => {
  // Podrobný diagnostický výpis — nech vidíme presne, čo service worker
  // skutočne dostal pri OZAJSTNEJ (nie testovacej z DevTools) push správe.
  console.log("[sw] push event prijatý, event.data existuje:", !!event.data);
  if (!event.data) {
    console.log("[sw] event.data je prázdne — správa prišla bez obsahu.");
    return;
  }
  let payload;
  try {
    const rawText = event.data.text();
    console.log("[sw] surový text správy (po rozšifrovaní prehliadačom):", rawText);
    payload = JSON.parse(rawText);
    console.log("[sw] JSON rozobraný v poriadku:", payload);
  } catch (e) {
    console.error("[sw] rozobratie správy zlyhalo:", e?.message || e);
    payload = { title: "mateco", body: "Chyba pri čítaní správy — pozri konzolu." };
  }
  const title = payload.title || "mateco";
  const options = {
    body: payload.body || "",
    icon: `${self.registration.scope}icon-192.png`,
    badge: `${self.registration.scope}icon-192.png`,
    data: { link: payload.link || null, notificationId: payload.notificationId || null },
  };
  event.waitUntil(
    self.registration.showNotification(title, options).catch((e) => {
      console.error("[sw] showNotification zlyhalo", e);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const params = new URLSearchParams();
  if (data.link) params.set("notif", btoa(encodeURIComponent(JSON.stringify(data.link))));
  if (data.notificationId) params.set("notifId", data.notificationId);
  const qs = params.toString();
  const targetUrl = `${self.registration.scope}${qs ? `?${qs}` : ""}`;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.registration.scope) && "focus" in client) {
          // Appka je už otvorená — pošli jej správu priamo (postMessage),
          // nech si to prepne sama, bez akéhokoľvek načítavania odznova.
          // Meniť adresu (client.navigate) by síce tiež fungovalo, ale vždy
          // by to vynútilo celé opätovné načítanie appky, čo tu netreba.
          client.postMessage({ type: "mateco_notification_click", link: data.link || null, notificationId: data.notificationId || null });
          return client.focus();
        }
      }
      // Appka nie je otvorená vôbec — tu sa novému oknu inak niet ako
      // prihovoriť, kým sa nenačíta, preto ide cez adresu ("?notif=..."),
      // čo appka spracuje sama hneď po svojom (aj tak nutnom) načítaní.
      return clients.openWindow(targetUrl);
    })
  );
});

// --- Appshell cache (Fáza 1) --------------------------------------------
// Len GET a len vlastná doména — volania na Supabase (iná doména, živé dáta)
// sa NIKDY necachujú, musia byť vždy naživo. Appshell je network-first: kým
// je appka online, vždy dostane najčerstvejšiu verziu (appka má aj vlastnú
// kontrolu novej verzie cez version.json, netreba to tu duplikovať) — cache
// sa len potichu dopĺňa popri tom, a použije sa až keď fetch zlyhá (offline).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(
        () =>
          caches.match(req).then((cached) => cached || (req.mode === "navigate" ? caches.match(self.registration.scope) : undefined))
      )
  );
});
