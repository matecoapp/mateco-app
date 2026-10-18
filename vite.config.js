import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" znamená relatívne cesty k súborom (JS/CSS) — funguje to na GitHub
// Pages bez ohľadu na to, ako sa repozitár volá, netreba nič ručne meniť.
export default defineConfig({
  plugins: [react()],
  base: "./",
  // Automatické testy (npm test, aj na GitHube pred nasadením) — bežia bez databázy.
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.js"],
    env: { VITE_SUPABASE_URL: "http://localhost:54321", VITE_SUPABASE_ANON_KEY: "test" },
  },
  // sourcemap: true — appka sa aj naďalej zmenší (minifikuje) rovnako ako doteraz,
  // toto len pridá súbor navyše (.js.map), vďaka ktorému prehliadač v konzole
  // (a v tejto chybovej obrazovke) ukáže skutočné mená funkcií a presné miesto
  // v zdrojovom kóde namiesto zašifrovaných písmeniek — nič iné sa nemení.
  build: {
    sourcemap: true,
    // Knižnice (React, Supabase, Sentry) v samostatnom súbore — pri novej verzii sa mení len
    // súbor platformy, knižnice ostanú v prehliadači uložené a znova sa nesťahujú (v1.0.807).
    rollupOptions: {
      output: {
        manualChunks: { kniznice: ["react", "react-dom", "@supabase/supabase-js", "@sentry/react"] },
      },
    },
  },
});
