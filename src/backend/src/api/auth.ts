import { createRemoteJWKSet, jwtVerify } from "jose";
import type { MiddlewareHandler } from "@hono/hono";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

async function verifyFirebaseToken(token: string): Promise<string> {
  const projectId = Deno.env.get("GCP_PROJECT_ID") ?? "anki-lm";
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload.sub!;
}

export const requireAuth: MiddlewareHandler<{ Variables: { userId: string } }> = async (
  c,
  next,
) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  try {
    const uid = await verifyFirebaseToken(header.slice(7));
    c.set("userId", uid);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
