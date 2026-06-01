import { createRemoteJWKSet, jwtVerify } from "jose";
import type { MiddlewareHandler } from "@hono/hono";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://xqnmnnhicbpjkaksagmg.supabase.co/auth/v1/.well-known/jwks.json",
  ),
);

async function verifySupabaseToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: "https://xqnmnnhicbpjkaksagmg.supabase.co/auth/v1",
    audience: "authenticated",
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
    const uid = await verifySupabaseToken(header.slice(7));
    c.set("userId", uid);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
