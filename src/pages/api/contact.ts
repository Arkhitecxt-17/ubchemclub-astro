import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, url }) => {
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !subject || !message) {
    return new Response("Missing required fields", { status: 400 });
  }

  const redirectUrl = new URL("/contact", url.origin);
  redirectUrl.searchParams.set("submitted", "true");

  return Response.redirect(redirectUrl.toString(), 303);
};

export const GET: APIRoute = async () => {
  return new Response("Method not allowed", { status: 405 });
};