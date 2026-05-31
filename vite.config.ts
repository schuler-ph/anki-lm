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
    "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify("AIzaSyDg3QiaSwonr2u66rC27x9xCITHsm7GNTY"),
    "import.meta.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify("anki-lm.firebaseapp.com"),
    "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify("anki-lm"),
    "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify("1:819170134777:web:a08cfa7a33588d2a57b028"),
  },
}));
