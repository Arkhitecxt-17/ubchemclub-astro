export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  const env = (locals.runtime.env as any);
  const bucket = env.MEMBERSHIP_BUCKET;
  const key = params.key;

  if (!key) return new Response("Not found", { status: 404 });

  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=3600");

  return new Response(object.body, { headers });
};