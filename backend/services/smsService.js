import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * SMS Service using SMS8.io gateway
 * Keeps API details hidden behind environment variables
 */
class SmsService {
  constructor() {
    // placeholders - populate from .env
    this.apiKey = process.env.SMS8_API_KEY || "";
    this.device = process.env.SMS8_DEVICE_ID || "";
    this.endpoint = "https://api.sms8.io/v1/send";
  }

  /**
   * Send a text alert to a mobile number.
   * @param {string} contactNumber - recipient phone number in international or local Sri Lankan format
   * @param {string} message - the SMS text body
   * @returns {Promise<object>} response from SMS gateway
   * @throws if network or gateway returns error
   */
  async sendAlert(contactNumber, message) {
    if (!this.apiKey || !this.device) {
      throw new Error("SMS service not configured - missing API key or device id");
    }

    const payload = {
      apiKey: this.apiKey,
      device: this.device,
      number: contactNumber,
      message,
    };

    const response = await axios.post(this.endpoint, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  }
}

export default new SmsService();
