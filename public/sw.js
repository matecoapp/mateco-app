// Service worker — beží nezávisle od otvorenej appky/karty. Dve úlohy:
// 1) keď príde push správa zo servera, zobrazí ju ako notifikáciu v telefóne/PC
// 2) keď na ňu niekto klikne, otvorí (alebo prepne na už otvorenú) appku a
//    pošle jej presne to miesto, kam má doskočiť (appka si to prevezme sama
//    pri načítaní — cez "?notif=" v URL, appka to sama vyčistí z adresy).

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "mateco", body: event.data.text() };
  }
  const title = payload.title || "mateco";
  const options = {
    body: payload.body || "",
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { link: payload.link || null },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data && event.notification.data.link;
  let targetUrl = self.registration.scope; // koreň appky, ak niet konkrétneho odkazu
  if (link) {
    const encoded = btoa(encodeURIComponent(JSON.stringify(link)));
    targetUrl = `${self.registration.scope}?notif=${encoded}`;
  }
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
