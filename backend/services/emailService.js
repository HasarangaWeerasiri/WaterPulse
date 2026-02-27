import { Resend } from 'resend';

/**
 * Email Service — low-level Resend API wrapper
 *
 * SRP : Only responsibility is sending emails via Resend.
 *       It knows nothing about tasks, reports, or who gets notified when.
 *
 * OCP : Other notification channels (SMS, push) are added in
 *       notificationService without touching this file.
 *
 * Designed to fail gracefully:
 *   - Missing RESEND_API_KEY  → logs a warning, returns false, never throws
 *   - Send failure at runtime → logs the error,  returns false, never throws
 *   Neither case interrupts the caller's business logic.
 *
 * Free tier: 3,000 emails/month — https://resend.com
 */
class EmailService {
  constructor() {
    /** @type {Resend | null} */
    this._client = null;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Lazily initialise the Resend client on first use.
   * Returns null when the API key is not configured.
   * @returns {Resend | null}
   */
  _getClient() {
    if (this._client) return this._client;

    const { RESEND_API_KEY } = process.env;

    if (!RESEND_API_KEY) {
      console.warn(
        '[EmailService] RESEND_API_KEY is not set — email notifications are disabled.\n' +
        '              Add RESEND_API_KEY to your .env file to enable them.'
      );
      return null;
    }

    this._client = new Resend(RESEND_API_KEY);
    return this._client;
  }

  // ─── Public ─────────────────────────────────────────────────────────────────

  /**
   * Send a single email.
   *
   * @param {Object}  options
   * @param {string}  options.to      - Recipient email address
   * @param {string}  options.subject - Email subject line
   * @param {string}  options.html    - HTML body
   * @param {string} [options.text]   - Plain-text fallback
   * @returns {Promise<boolean>} true on success, false if misconfigured or send failed
   */
  async sendEmail({ to, subject, html, text }) {
    const client = this._getClient();
    if (!client) return false;

    if (!to) {
      console.warn('[EmailService] sendEmail called without a recipient — skipping.');
      return false;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'WaterPulse <onboarding@resend.dev>';

    try {
      const { data, error } = await client.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        ...(text && { text }),
      });

      if (error) {
        console.error(`[EmailService] Failed to send to ${to}: ${error.message}`);
        return false;
      }

      console.info(`[EmailService] Email sent to ${to} — MessageId: ${data?.id ?? 'n/a'}`);
      return true;
    } catch (err) {
      // Never re-throw: email failure must not crash core business logic
      console.error(`[EmailService] Failed to send to ${to}: ${err.message}`);
      return false;
    }
  }
}

export default new EmailService();
