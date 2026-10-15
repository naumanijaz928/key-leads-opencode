import { Resend } from "resend";

import { isEmailConfigured } from "@/lib/env";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  if (!isEmailConfigured()) {
    console.info(
      `[email:dev] would send to=${to} subject="${subject}"\n${text ?? html}`,
    );
    return { skipped: true as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "KeyLeads <onboarding@resend.dev>";

  const result = await resend.emails.send({ from, to, subject, html, text });

  if (result.error) {
    console.error("[email] send failed:", result.error);
  }

  return { skipped: false as const, id: result.data?.id };
}

function shell(title: string, body: string, cta?: { href: string; label: string }) {
  return `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7fb;padding:32px">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e7e8ee;padding:32px">
      <p style="margin:0 0 4px;font-weight:600;color:#5b4bdb">KeyLeads</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#1c1e26">${title}</h1>
      <div style="color:#4a4e5a;font-size:14px;line-height:1.6">${body}</div>
      ${
        cta
          ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:#5b4bdb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">${cta.label}</a>`
          : ""
      }
      <p style="margin-top:28px;color:#9aa0ad;font-size:12px">KeyLeads · remote job leads</p>
    </div>
  </div>`;
}

export function inviteEmail(params: { link: string; role: string; inviter?: string }) {
  return {
    subject: "You're invited to KeyLeads",
    html: shell(
      "You've been invited",
      `<p>${params.inviter ? `${params.inviter} invited you` : "You've been invited"} to join KeyLeads as <strong>${params.role.replace(
        "_",
        " ",
      )}</strong>.</p><p>Click below to set your name and password. This link expires in 7 days.</p>`,
      { href: params.link, label: "Accept invitation" },
    ),
  };
}

export function signupReceivedEmail() {
  return {
    subject: "We received your KeyLeads request",
    html: shell(
      "Request received",
      "<p>Thanks for signing up. Your account is in the waiting list and a super admin will review it shortly. You'll get another email once you're approved.</p>",
    ),
  };
}

export function signupApprovedEmail() {
  return {
    subject: "Your KeyLeads account is approved",
    html: shell(
      "You're approved",
      "<p>Your account has been approved. You can sign in and start working with leads.</p>",
      { href: "/login", label: "Sign in" },
    ),
  };
}

export function signupRejectedEmail(reason?: string) {
  return {
    subject: "Your KeyLeads request",
    html: shell(
      "Request not approved",
      `<p>Your sign-up request was not approved.</p>${
        reason ? `<p>${reason}</p>` : ""
      }`,
    ),
  };
}

export function passwordResetEmail(link: string) {
  return {
    subject: "Reset your KeyLeads password",
    html: shell(
      "Reset your password",
      "<p>Click below to choose a new password. If you didn't request this, you can ignore this email.</p>",
      { href: link, label: "Reset password" },
    ),
  };
}
