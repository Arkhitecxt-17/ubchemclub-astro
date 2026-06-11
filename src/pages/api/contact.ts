export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";

export const POST: APIRoute = async ({ request, locals }) => {
  const resend = new Resend((locals.runtime.env as any).RESEND_API_KEY);
  const clubEmail = (locals.runtime.env as any).CLUB_EMAIL;

  const form = await request.formData();
  const name = form.get("name")?.toString().trim();
  const email = form.get("email")?.toString().trim();
  const subject = form.get("subject")?.toString().trim();
  const message = form.get("message")?.toString().trim();

  if (!name || !email || !subject || !message) {
    return new Response("Missing fields", { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "UBCC Website <onboarding@resend.dev>",
      to: clubEmail,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return Response.redirect(
      new URL("/contact?submitted=true", request.url),
      302
    );
  } catch (err) {
    console.error("Email error:", err);
    return Response.redirect(
      new URL("/contact?error=true", request.url),
      302
    );
  }
};