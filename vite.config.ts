import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
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
