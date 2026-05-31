// @ts-nocheck — Worker types are handled by wrangler, not tsconfig.app.json

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Proxy Firebase auth handler through our domain to avoid third-party
    // storage blocking in modern browsers (Chrome 115+, Firefox, Safari).
    if (url.pathname.startsWith("/__/auth/")) {
      const target = new URL(
        url.pathname + url.search,
        "https://anki-lm.firebaseapp.com",
      );
      return fetch(target.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body ?? undefined,
      });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
