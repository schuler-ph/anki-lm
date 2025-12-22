import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    { enforce: "pre", ...mdx() },
    react(),
    tailwindcss(),
  ],
  base: "/dir-praxis/",
});
