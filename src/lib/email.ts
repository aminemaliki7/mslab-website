import "server-only";

/**
 * Provider-agnostic transactional email (ADR-008). The provider is not chosen yet:
 *   EMAIL_PROVIDER=resend + EMAIL_PROVIDER_API_KEY + EMAIL_FROM  → sends through Resend's HTTP API
 *   anything else (default)                                      → "disabled": nothing is sent
 * Submissions are always stored first, so a disabled/failed provider never loses a lead;
 * the outcome is recorded on the row (notified_at / notification_error) for the admin.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain text only: no HTML templating of user input. */
  text: string;
  replyTo?: string;
};

export type EmailResult = { ok: true } | { ok: false; error: string };

export function emailConfig() {
  const provider = process.env.EMAIL_PROVIDER ?? "disabled";
  return {
    provider,
    from: process.env.EMAIL_FROM ?? null,
    notifyTo: process.env.INQUIRY_NOTIFICATION_TO ?? null,
    enabled: provider === "resend" && Boolean(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM),
  };
}

const SAFE_HEADER = /^[^\r\n]{1,300}$/;

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const config = emailConfig();
  if (!config.enabled) return { ok: false, error: "email_disabled" };
  if (!SAFE_HEADER.test(message.subject) || (message.replyTo && !SAFE_HEADER.test(message.replyTo))) {
    return { ok: false, error: "invalid_header" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_PROVIDER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, error: `provider_http_${response.status}` };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? `provider_${error.name}` : "provider_error" };
  }
}
