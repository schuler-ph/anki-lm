import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
      }),
    },
    react(),
    tailwindcss(),
    cloudflare(),
  ],
  base: "/",
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      mode === "production"
        ? "https://ankilm-backend-api-j2mn4yc65q-ey.a.run.app"
        : "http://localhost:8080"
    ),
  },
}));
