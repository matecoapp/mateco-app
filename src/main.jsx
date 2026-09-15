import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CustomerPortal from "./CustomerPortal.jsx";

// Po opustení textového políčka (klik mimo / "Hotovo" na klávesnici) appka
// automaticky vráti zoom na pôvodnú veľkosť — rieši len samotné priblíženie,
// ktoré si iOS/Android robí sám pri kliknutí do políčka, tomu sa vyhnúť nedá.
function resetMobileZoom() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;
  const original = viewport.getAttribute("content");
  viewport.setAttribute("content", `${original}, maximum-scale=1.0`);
  window.setTimeout(() => {
    viewport.setAttribute("content", original);
  }, 300);
}
document.addEventListener(
  "focusout",
  (e) => {
    if (e.target && e.target.matches && e.target.matches("input, textarea, select")) {
      resetMobileZoom();
    }
  },
  true
);

// Zákaznícky portál (bez prihlásenia) — ak je v URL "?portal=<token>", vykresli
// len tú ľahkú stránku namiesto celej dispečerskej appky. Kontroluje sa skôr než
// čokoľvek iné, nech to nezávisí na zvyšku inicializácie.
const portalToken = new URLSearchParams(window.location.search).get("portal");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {portalToken ? <CustomerPortal token={portalToken} /> : <App />}
  </React.StrictMode>
);

// Kontrola novej verzie — najmä pre appku "pridanú na plochu" (PWA), tá nemá
// žiadne tlačidlo na obnovenie ako bežná karta v prehliadači, takže vie ostať
// zaseknutá na starej verzii, kým ju niekto ručne neodinštaluje a nepridá
// znova. Pri každom otvorení appka porovná svoje uložené číslo verzie s tým
// najnovším nasadeným (version.json, zapisovaný pri každom builde s novým
// obsahom, takže sa nedá zamieniť so starou vecou z medzipamäte) — ak sa
// líšia, appku to potichu prinúti načítať odznova s čerstvým obsahom, bez
// toho, aby to niekto musel riešiť ručne. Prvé vôbec otvorenie si len
// zapamätá aktuálnu verziu, nič neobnovuje (nemá s čím porovnávať).
(function checkForNewVersion() {
  const STORAGE_KEY = "mateco_app_version";
  fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data || !data.v) return;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== data.v) {
        localStorage.setItem(STORAGE_KEY, data.v);
        const url = new URL(window.location.href);
        url.searchParams.set("_v", data.v);
        window.location.replace(url.toString());
        return;
      }
      localStorage.setItem(STORAGE_KEY, data.v);
    })
    .catch(() => {
      // Bez pripojenia alebo iná chyba — appka jednoducho pokračuje s tým,
      // čo má práve načítané, skúsi to znova nabudúce.
    });
})();
