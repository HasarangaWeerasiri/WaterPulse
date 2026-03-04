# SMS Service Guide

This document explains how the SMS alert feature works in the **WaterPulse** backend and how to exercise it using **Postman**. The service uses the [SMS8.io](https://sms8.io) gateway to deliver text messages to Sri Lankan phone numbers.

---

## 📦 Requirements

1. **Environment variables** must be set in your `.env` (backend root):

   ```text
   SMS8_API_KEY=<your_sms8_api_key_here>
   SMS8_DEVICE_ID=<your_sms8_device_id_here>
   ```

2. The user who should receive the SMS must have a valid `phoneNumber` stored in the database. The number must follow the Sri Lankan mobile format:

   - Must start with `07` or `+947`
   - Exactly 10 digits after the `0` or the international prefix
   - Validated by regex: `/^(?:0|94|\+94)?7(?:0|1|2|4|5|6|7|8)\d{7}$/`

3. Install dependencies (`axios`, etc.) and start the backend server (`npm run start`).

---

## 🛠 How It Works

- The `SmsService` class (`backend/services/smsService.js`) wraps the POST request to the SMS8 API.
- `WaterLogService.createLog()` calls this service **after** it synchronizes the status of a related contamination report.
- Based on the calculated `safetyRating`, a message is constructed and sent to the report creator, if a phone number is present.
- Failures in SMS delivery are logged but do not interrupt the normal API response.

---

## ✅ Triggering an SMS via Postman

Currently the SMS logic is invoked indirectly, so you simulate it using the existing water log creation endpoint.

1. **Ensure you have a user with a valid Sri Lankan phone number.** You can create one via the `/api/auth/register` endpoint.

   Example body (adjust `phoneNumber` as needed):

   ```json
   {
     "firstName": "Kasun",
     "lastName": "Perera",
     "email": "kasun@example.com",
     "password": "password123",
     "phoneNumber": "0771234567"
   }
   ```

2. **Create a contamination report** (if you don't already have one) using `/api/reports`.
   Make sure `reportedBy` refers to the user from step 1. Example:

   ```json
   {
     "title": "Dirty water at well",
     "description": "Strange smell",
     "location": { "type": "Point", "coordinates": [79.86, 6.90] },
     "reportedBy": "<UserID>"
   }
   ```

3. **Create a water log** for that report via `/api/water-logs` with pH and turbidity values.
   - If you send safe values (e.g. pH 7.0, turbidity 3), the SMS text will say the report has been **Resolved**.
   - If you send unsafe values (e.g. pH 4.0, turbidity 12), the SMS text will send an **Alert**.

   ```json
   {
     "reportId": "<ReportID>",
     "phLevel": 4.0,
     "turbidity": 12,
     "region": "North"
   }
   ```

4. Inspect your SMS gateway logs or the console where the backend runs. A successful send produces a POST to the SMS8 endpoint; failures are logged as errors but the API still returns a 200/201.

> ❗ Note: you can also call the SMS service directly from a quick route if you prefer; simply create a `POST /api/test-sms` that invokes `smsService.sendAlert(number, message)`.

---

## 📌 Direct Postman Test (optional)

If you need a direct endpoint:

```js
// inside any controller file (e.g. tests)
import smsService from "../services/smsService.js";

app.post("/api/test-sms", async (req, res) => {
  const { number, message } = req.body;
  try {
    const result = await smsService.sendAlert(number, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Then use Postman:

- **URL:** `POST http://localhost:5000/api/test-sms`
- **Body: JSON**
  ```json
  {
    "number": "0771234567",
    "message": "This is a test SMS from WaterPulse!"
  }
  ```

---

## 📝 Troubleshooting

- If you see `SMS service not configured` error, check your `.env` values and restart.  
- Invalid phone number errors originate from Mongoose validation.  
- Inspect backend console for `console.error` logs when an SMS attempt fails.

---

This page should help you confidently test and troubleshoot the Sri Lankan SMS alert feature using Postman. Feel free to extend with more automated tests or configure a dedicated testing route!
