import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" znamená relatívne cesty k súborom (JS/CSS) — funguje to na GitHub
// Pages bez ohľadu na to, ako sa repozitár volá, netreba nič ručne meniť.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
