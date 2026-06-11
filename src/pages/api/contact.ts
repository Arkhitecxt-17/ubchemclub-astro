export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime.env as any);
  const resend = new Resend(env.RESEND_API_KEY);
  const clubEmail = env.CLUB_EMAIL;

  const form = await request.formData();
  const name = form.get("name")?.toString().trim();
  const email = form.get("email")?.toString().trim();
  const subject = form.get("subject")?.toString().trim();
  const message = form.get("message")?.toString().trim();

  if (!name || !email || !subject || !message) {
    return Response.redirect(new URL("/contact?error=missing", request.url), 302);
  }

  try {
    await resend.emails.send({
      from: "UBCC Website <onboarding@resend.dev>",
      to: clubEmail,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Name</strong></td><td style="padding:8px;border:1px solid #eee">${name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Email</strong></td><td style="padding:8px;border:1px solid #eee">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Subject</strong></td><td style="padding:8px;border:1px solid #eee">${subject}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Message</strong></td><td style="padding:8px;border:1px solid #eee">${message.replace(/\n/g, "<br>")}</td></tr>
        </table>
      `,
    });

    return Response.redirect(new URL("/contact?submitted=true", request.url), 302);
  } catch (err) {
    console.error("Email error:", err);
    return Response.redirect(new URL("/contact?error=true", request.url), 302);
  }
};