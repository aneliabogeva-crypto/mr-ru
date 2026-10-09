import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Относителни пътища: сайтът работи и от подпапка (GitHub Pages: /mr-ru/).
  base: "./",
  server: { port: 5173, open: true },
});
