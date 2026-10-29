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
// Tokeny sú malými písmenami (claim_job_public_token) — niektoré aplikácie odkaz prepíšu na veľké.
// Pošta/SMS pripoja k odkazu bodku, zátvorku či medzeru — berie sa len samotné UUID.
const portalParam = new URLSearchParams(window.location.search).get("portal");
const portalToken = portalParam && (portalParam.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] || portalParam).toLowerCase();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {portalToken ? <CustomerPortal token={portalToken} /> : <App />}
  </React.StrictMode>
);
