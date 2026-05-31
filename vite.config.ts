import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [{
    enforce: "pre",
    ...mdx({
      remarkPlugins: [remarkGfm], // <--- 2. Hier aktivieren
    }),
  }, react(), tailwindcss(), cloudflare()],
  base: "/",
});