import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" znamená relatívne cesty k súborom (JS/CSS) — funguje to na GitHub
// Pages bez ohľadu na to, ako sa repozitár volá, netreba nič ručne meniť.
export default defineConfig({
  plugins: [react()],
  base: "./",
  // sourcemap: true — appka sa aj naďalej zmenší (minifikuje) rovnako ako doteraz,
  // toto len pridá súbor navyše (.js.map), vďaka ktorému prehliadač v konzole
  // (a v tejto chybovej obrazovke) ukáže skutočné mená funkcií a presné miesto
  // v zdrojovom kóde namiesto zašifrovaných písmeniek — nič iné sa nemení.
  build: {
    sourcemap: true,
  },
});
