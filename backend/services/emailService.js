import * as brevo from '@getbrevo/brevo';

/**
 * Email Service — low-level Brevo (Sendinblue) API wrapper
 *
 * SRP : Only responsibility is sending emails via Brevo.
 *       It knows nothing about tasks, reports, or who gets notified when.
 *
 * OCP : Other notification channels (SMS, push) are added in
 *       notificationService without touching this file.
 *
 * Designed to fail gracefully:
 *   - Missing BREVO_API_KEY   → logs a warning, returns false, never throws
 *   - Send failure at runtime → logs the error,  returns false, never throws
 *   Neither case interrupts the caller's business logic.
 *
 * Free tier: 300 emails/day — https://app.brevo.com
 */
class EmailService {
  constructor() {
    /** @type {brevo.TransactionalEmailsApi | null} */
    this._apiInstance = null;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Lazily initialise the Brevo client on first use.
   * Returns null when the API key is not configured.
   * @returns {brevo.TransactionalEmailsApi | null}
   */
  _getApiInstance() {
    if (this._apiInstance) return this._apiInstance;

    const { BREVO_API_KEY } = process.env;

    if (!BREVO_API_KEY) {
      console.warn(
        '[EmailService] BREVO_API_KEY is not set — email notifications are disabled.\n' +
        '              Add BREVO_API_KEY to your .env file to enable them.'
      );
      return null;
    }

    const instance = new brevo.TransactionalEmailsApi();
    instance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      BREVO_API_KEY
    );

    this._apiInstance = instance;
    return this._apiInstance;
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
    const apiInstance = this._getApiInstance();
    if (!apiInstance) return false;

    if (!to) {
      console.warn('[EmailService] sendEmail called without a recipient — skipping.');
      return false;
    }

    const email = new brevo.SendSmtpEmail();
    email.to              = [{ email: to }];
    email.sender          = { email: process.env.BREVO_FROM_EMAIL, name: 'WaterPulse' };
    email.subject         = subject;
    email.htmlContent     = html;
    if (text) email.textContent = text;

    try {
      const result = await apiInstance.sendTransacEmail(email);
      console.info(`[EmailService] Email sent to ${to} — MessageId: ${result.body?.messageId ?? 'n/a'}`);
      return true;
    } catch (err) {
      // Never re-throw: email failure must not crash core business logic
      const detail = err.response?.body?.message ?? err.message;
      console.error(`[EmailService] Failed to send to ${to}: ${detail}`);
      return false;
    }
  }
}

export default new EmailService();
