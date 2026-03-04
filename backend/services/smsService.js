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
    this.endpoint = "https://app.sms8.io/services/send.php";
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

    // SMS8.io V2 API uses strict parameter names. Use local Sri Lankan format
    // (starts with 0) or international format (+94). The API expects 'number',
    // not 'phone', and 'devices', not 'deviceid'; sending wrong keys will
    // deduct credits but fail to deliver the message.
    const payload = {
      key: this.apiKey,
      devices: this.device,        // Correct key: 'devices' not 'deviceid'
      number: contactNumber,         // Correct key: 'number' not 'phone'
      message: message,              // Correct key: 'message' not 'msg'
      type: "sms",                   // Specify delivery type
      prioritize: 1                  // Set priority
    };

    // Log the exact payload being sent so we can verify correctness
    console.debug("[SmsService] payload to SMS8.io", payload);

    // SMS8 expects urlencoded form data, so stringify it explicitly. Axios
    // will not convert an object automatically when you override the
    // Content-Type header, which led to us POSTing JSON in earlier versions.
    const formBody = new URLSearchParams(payload).toString();

    try {
      const response = await axios.post(this.endpoint, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      console.debug("[SmsService] gateway response", response.data);

      // Check for successful response from SMS8
      if (response.data && response.data.success !== true) {
        throw new Error(`SMS8.io rejected request: ${JSON.stringify(response.data)}`);
      }
      return response.data;
    } catch (err) {
      console.error("[SmsService] network/gateway error:", err.message);
      throw err;
    }
  }
}

export default new SmsService();
