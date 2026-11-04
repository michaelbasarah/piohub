import { ENV } from "./env";

const RESEND_API_URL = "https://api.resend.com/emails";

// Names and titles are user input — escape them before they go into HTML.
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) return true;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: ENV.resendFromEmail, to, subject, html }),
    });

    if (!response.ok) {
      console.error("[Email] Failed:", await response.json());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error:", error);
    return false;
  }
}

export function generateJoinRequestEmailHtml(
  requesterName: string,
  projectTitle: string,
  dashboardUrl: string
): string {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
      .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    </style></head>
    <body><div class="container">
      <div class="header"><h1>New Join Request</h1></div>
      <div class="content">
        <p>Hi there!</p>
        <p><strong>${escapeHtml(requesterName)}</strong> has requested to join your project <strong>"${escapeHtml(projectTitle)}"</strong>.</p>
        <p>Visit your dashboard to approve or reject their request.</p>
        <a href="${dashboardUrl}" class="button">View Dashboard</a>
      </div>
      <div class="footer"><p>© 2026 pioNox</p></div>
    </div></body></html>
  `;
}

export function generateApprovalEmailHtml(projectTitle: string, projectUrl: string): string {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
      .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    </style></head>
    <body><div class="container">
      <div class="header"><h1>You've Been Approved!</h1></div>
      <div class="content">
        <p>Great news!</p>
        <p>Your request to join <strong>"${escapeHtml(projectTitle)}"</strong> has been approved. You're now a member of the team!</p>
        <a href="${projectUrl}" class="button">View Project</a>
      </div>
      <div class="footer"><p>© 2026 pioNox</p></div>
    </div></body></html>
  `;
}

export function generateRejectionEmailHtml(projectTitle: string): string {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #faf5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    </style></head>
    <body><div class="container">
      <div class="header"><h1>Request Update</h1></div>
      <div class="content">
        <p>Hi there,</p>
        <p>Thank you for your interest in <strong>"${escapeHtml(projectTitle)}"</strong>. Unfortunately, your request was not accepted at this time.</p>
        <p>Don't worry — there are many other great projects on pioHub. Keep exploring!</p>
      </div>
      <div class="footer"><p>© 2026 pioNox</p></div>
    </div></body></html>
  `;
}
