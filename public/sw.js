// Service worker — beží nezávisle od otvorenej appky/karty. Dve úlohy:
// 1) keď príde push správa zo servera, zobrazí ju ako notifikáciu v telefóne/PC
// 2) keď na ňu niekto klikne, otvorí (alebo prepne na už otvorenú) appku a
//    pošle jej presne to miesto, kam má doskočiť (appka si to prevezme sama
//    pri načítaní — cez "?notif=" v URL, appka to sama vyčistí z adresy).
//
// skipWaiting/clients.claim — bez tohto by nová verzia service workera (napr.
// keď sa táto logika niekedy nabudúce upraví) čakala, kým človek úplne
// zavrie VŠETKY otvorené karty/appku, než by sa vôbec prevzala — dovtedy by
// ticho bežala tá stará verzia, čo o žiadnych zmenách nevie. Toto zaisťuje,
// že sa nová verzia ujme hneď.
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
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
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
