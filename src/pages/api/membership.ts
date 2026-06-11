export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime.env as any);
  const resend = new Resend(env.RESEND_API_KEY);
  const clubEmail = env.CLUB_EMAIL;
  const db = env.DB;
  const bucket = env.MEMBERSHIP_BUCKET;

  const form = await request.formData();

  const fullName = form.get("full_name")?.toString().trim();
  const email = form.get("email")?.toString().trim();
  const phone = form.get("phone")?.toString().trim();
  const membershipType = form.get("membership_type")?.toString().trim();
  const studentId = form.get("student_id")?.toString().trim() || null;
  const institution = form.get("institution")?.toString().trim() || null;
  const companyName = form.get("company_name")?.toString().trim() || null;
  const contactPerson = form.get("contact_person")?.toString().trim() || null;
  const proofFile = form.get("proof_of_payment") as File | null;

  if (!fullName || !email || !phone || !membershipType || !proofFile) {
    return Response.redirect(new URL("/membership?error=missing", request.url), 302);
  }

  // Upload proof of payment to R2
  let proofUrl = "";
  try {
    const ext = proofFile.name.split(".").pop();
    const key = `proof-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await proofFile.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: { contentType: proofFile.type },
    });
    proofUrl = key;
  } catch (err) {
    console.error("R2 upload error:", err);
    return Response.redirect(new URL("/membership?error=upload", request.url), 302);
  }

  // Save to D1
  try {
    await db.prepare(
      `INSERT INTO memberships (full_name, email, phone, membership_type, student_id, institution, company_name, contact_person, proof_of_payment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(fullName, email, phone, membershipType, studentId, institution, companyName, contactPerson, proofUrl).run();
  } catch (err) {
    console.error("D1 error:", err);
    return Response.redirect(new URL("/membership?error=db", request.url), 302);
  }

  // Send email notification
  const isStudent = membershipType === "undergraduate" || membershipType === "postgraduate";
  const isCorporate = membershipType === "corporate";

  try {
    await resend.emails.send({
      from: "UBCC Website <onboarding@resend.dev>",
      to: clubEmail,
      replyTo: email,
      subject: `New Membership Application — ${fullName} (${membershipType})`,
      html: `
        <h2>New Membership Application</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Name</strong></td><td style="padding:8px;border:1px solid #eee">${fullName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Email</strong></td><td style="padding:8px;border:1px solid #eee">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #eee">${phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Membership Type</strong></td><td style="padding:8px;border:1px solid #eee">${membershipType}</td></tr>
          ${isStudent ? `<tr><td style="padding:8px;border:1px solid #eee"><strong>Student ID</strong></td><td style="padding:8px;border:1px solid #eee">${studentId ?? "—"}</td></tr>` : ""}
          ${isStudent ? `<tr><td style="padding:8px;border:1px solid #eee"><strong>Institution</strong></td><td style="padding:8px;border:1px solid #eee">${institution ?? "—"}</td></tr>` : ""}
          ${isCorporate ? `<tr><td style="padding:8px;border:1px solid #eee"><strong>Company</strong></td><td style="padding:8px;border:1px solid #eee">${companyName ?? "—"}</td></tr>` : ""}
          ${isCorporate ? `<tr><td style="padding:8px;border:1px solid #eee"><strong>Contact Person</strong></td><td style="padding:8px;border:1px solid #eee">${contactPerson ?? "—"}</td></tr>` : ""}
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Proof of Payment</strong></td><td style="padding:8px;border:1px solid #eee">Stored in R2: ${proofUrl}</td></tr>
        </table>
        <p style="margin-top:16px">View all applications at <a href="https://ubchemclub-astro.202101335.workers.dev/admin/members">Admin Members Panel</a></p>
      `,
    });
  } catch (err) {
    console.error("Email error:", err);
    // Don't redirect to error — data is already saved, email is non-critical
  }

  return Response.redirect(new URL("/membership?submitted=true", request.url), 302);
};