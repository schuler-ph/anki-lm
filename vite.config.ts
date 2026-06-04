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
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://xqnmnnhicbpjkaksagmg.supabase.co"),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxbm1ubmhpY2Jwamtha3NhZ21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjM1MTAsImV4cCI6MjA5NTgzOTUxMH0.cREyrXpAb3uq1SOGPcxjdEQYzj-ApAj9CSkkTA5idrk"),
  },
}));
