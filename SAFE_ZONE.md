# Safe-Zone Directory — Backend Documentation

> **Component Owner:** Member D
> **Module:** WaterPulse — Clean Water Source Management
> **Base URL:** `http://localhost:5000/api/safe-zones`

---

## Overview

The Safe-Zone Directory manages clean and safe water sources (tankers, wells, filters, taps, etc.) that citizens can locate during a water contamination crisis. Admins and Authority users control the data, while the public can freely read and search for nearby sources.

---

## File Structure

```
backend/
├── models/
│   └── safeZone.js              # Mongoose schema + GeoJSON index
├── controllers/
│   └── safeZoneController.js    # All business logic (7 functions)
├── routes/
│   └── safeZoneRoutes.js        # Route definitions + middleware guards
```

---

## Database Model

**Collection:** `safezones`
**File:** `backend/models/safeZone.js`

| Field         | Type          | Required | Description                                                  |
| ------------- | ------------- | -------- | ------------------------------------------------------------ |
| `name`        | String        | ✅ Yes   | Name of the water source                                     |
| `type`        | String        | ✅ Yes   | Enum: `Tanker`, `Well`, `Filter`, `Tap`, `Borehole`, `Other` |
| `description` | String        | No       | Optional details about the source                            |
| `location`    | GeoJSON Point | ✅ Yes   | `{ type: "Point", coordinates: [lng, lat] }`                 |
| `address`     | String        | No       | Auto-filled by reverse geocoding (Nominatim)                 |
| `isAvailable` | Boolean       | No       | `true` = available, `false` = empty/closed. Default: `true`  |
| `createdBy`   | ObjectId      | ✅ Yes   | Reference to the `User` who created it                       |
| `createdAt`   | Date          | Auto     | Timestamp (auto by Mongoose)                                 |
| `updatedAt`   | Date          | Auto     | Timestamp (auto by Mongoose)                                 |

**Geospatial Index:** `2dsphere` index on `location` — enables proximity queries via MongoDB `$near`.

---

## Third-Party APIs

### 1. Nominatim — Reverse Geocoding (Free)

- **Provider:** OpenStreetMap
- **URL:** `https://nominatim.openstreetmap.org/reverse`
- **Used in:** `createSafeZone`, `updateSafeZone`
- **Purpose:** Converts GPS coordinates into a human-readable address string, saved in the `address` field.
- **No API key required.** Uses a `User-Agent` header.
- **Env variable:** `NOMINATIM_USER_AGENT` (optional override)

### 2. OpenWeatherMap — Current Weather (Free Tier)

- **Provider:** OpenWeatherMap
- **URL:** `https://api.openweathermap.org/data/2.5/weather`
- **Used in:** `getSafeZoneWeather`
- **Purpose:** Fetches real-time weather for a safe zone's coordinates and calculates a contamination risk level.
- **Free tier:** 1,000 calls/day (no credit card required)
- **Env variable:** `OPENWEATHER_API_KEY` ← must be set in `.env`

---

## API Endpoints

### Public Routes _(no authentication required)_

---

#### GET `/api/safe-zones/all`

Fetch all safe zones. Used for admin tables and the full map view.

**Response `200`:**

```json
[
  {
    "_id": "699fcfc52f1e211eb5416e33",
    "name": "Navam Mawatha Tanker",
    "type": "Tanker",
    "description": "Free water near junction",
    "location": { "type": "Point", "coordinates": [79.8612, 6.9271] },
    "address": "Navam Mawatha, Colombo 02, Western Province, Sri Lanka",
    "isAvailable": true,
    "createdBy": {
      "firstName": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "createdAt": "2026-02-26T04:44:53.365Z"
  }
]
```

---

#### GET `/api/safe-zones/nearby`

Fetch the closest safe zones to a user's GPS position.

**Query Parameters:**

| Parameter     | Type   | Required | Default | Description                    |
| ------------- | ------ | -------- | ------- | ------------------------------ |
| `lat`         | Number | ✅ Yes   | —       | User's latitude                |
| `lng`         | Number | ✅ Yes   | —       | User's longitude               |
| `maxDistance` | Number | No       | `10000` | Search radius in **metres**    |
| `limit`       | Number | No       | `5`     | Max number of results returned |

**Example Request:**

```
GET /api/safe-zones/nearby?lat=6.9271&lng=79.8612&limit=5
```

**Response `200`:** Array of up to 5 nearest safe zones, sorted by distance (closest first).

**Error `400`:** `{ "message": "lat and lng query parameters are required" }`

---

#### GET `/api/safe-zones/:id`

Fetch a single safe zone by its MongoDB `_id`.

**Response `200`:** Single safe zone object.
**Error `404`:** `{ "message": "Safe zone not found" }`

---

#### GET `/api/safe-zones/:id/weather`

Fetch current weather and contamination risk for a specific safe zone.
Calls the **OpenWeatherMap API** using the safe zone's stored coordinates.

**Response `200`:**

```json
{
  "safeZone": {
    "id": "699fcfc52f1e211eb5416e33",
    "name": "Navam Mawatha Tanker",
    "type": "Tanker"
  },
  "weather": {
    "condition": "Rain",
    "description": "heavy intensity rain",
    "temperature": 28.4,
    "humidity": 91,
    "windSpeed": 3.5
  },
  "contamination": {
    "riskLevel": "High",
    "riskMessage": "Heavy precipitation detected. Outdoor wells and open tanks may be contaminated. Use with caution."
  }
}
```

**Contamination Risk Logic:**

| Condition                                 | Risk Level |
| ----------------------------------------- | ---------- |
| Rain / Thunder / Drizzle + humidity > 85% | **High**   |
| Rain / Thunder / Drizzle only             | **Medium** |
| Humidity > 90%, no rain                   | **Medium** |
| Clear / Clouds                            | **Low**    |

**Error `503`:** API key not configured.
**Error `404`:** Safe zone not found.

---

### Protected Routes _(Admin or Authority role required)_

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

---

#### POST `/api/safe-zones`

Create a new clean water source.

**Request Body (JSON):**

| Field         | Type   | Required | Description                                            |
| ------------- | ------ | -------- | ------------------------------------------------------ |
| `name`        | String | ✅ Yes   | Name of the water source                               |
| `type`        | String | ✅ Yes   | `Tanker`, `Well`, `Filter`, `Tap`, `Borehole`, `Other` |
| `latitude`    | Number | ✅ Yes   | GPS latitude of the source                             |
| `longitude`   | Number | ✅ Yes   | GPS longitude of the source                            |
| `description` | String | No       | Optional description                                   |

**Example Body:**

```json
{
  "name": "Navam Mawatha Tanker",
  "type": "Tanker",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "description": "Free water near junction"
}
```

**Response `201`:**

```json
{
  "message": "Safe zone created successfully",
  "safeZone": { ... }
}
```

---

#### PUT `/api/safe-zones/:id`

Update an existing safe zone. Only the fields you send will be updated.

**Request Body (JSON) — all optional:**

| Field         | Type    | Description                                |
| ------------- | ------- | ------------------------------------------ |
| `name`        | String  | New name                                   |
| `type`        | String  | New type                                   |
| `description` | String  | New description                            |
| `latitude`    | Number  | New latitude (will re-geocode address)     |
| `longitude`   | Number  | New longitude (will re-geocode address)    |
| `isAvailable` | Boolean | `true` = available, `false` = empty/closed |

**Common use — flip availability:**

```json
{ "isAvailable": false }
```

**Response `200`:**

```json
{
  "message": "Safe zone updated successfully",
  "safeZone": { ... }
}
```

---

#### DELETE `/api/safe-zones/:id`

Permanently remove a safe zone from the database.

**Response `200`:**

```json
{ "message": "Safe zone deleted successfully" }
```

**Error `404`:** `{ "message": "Safe zone not found" }`

---

## Environment Variables

Add these to `backend/.env`:

```env
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
NOMINATIM_USER_AGENT=WaterPulse/1.0 (your_email@example.com)
```

---

## Postman Testing Guide

### Step 1 — Get a token

**POST** `http://localhost:5000/api/auth/login`

```json
{ "email": "admin@example.com", "password": "yourpassword" }
```

Copy the `token` from the response.

### Step 2 — Test sequence

| #   | Method | URL                                             | Auth         | Body                                    |
| --- | ------ | ----------------------------------------------- | ------------ | --------------------------------------- |
| 1   | POST   | `/api/safe-zones`                               | Bearer token | `name`, `type`, `latitude`, `longitude` |
| 2   | GET    | `/api/safe-zones/all`                           | —            | —                                       |
| 3   | GET    | `/api/safe-zones/nearby?lat=6.9271&lng=79.8612` | —            | —                                       |
| 4   | GET    | `/api/safe-zones/:id`                           | —            | —                                       |
| 5   | GET    | `/api/safe-zones/:id/weather`                   | —            | —                                       |
| 6   | PUT    | `/api/safe-zones/:id`                           | Bearer token | `{ "isAvailable": false }`              |
| 7   | DELETE | `/api/safe-zones/:id`                           | Bearer token | —                                       |

---

## Access Control Summary

| Operation    | Roles Allowed        |
| ------------ | -------------------- |
| Create       | `admin`, `authority` |
| Read All     | Everyone (public)    |
| Read Nearby  | Everyone (public)    |
| Read Single  | Everyone (public)    |
| Read Weather | Everyone (public)    |
| Update       | `admin`, `authority` |
| Delete       | `admin`, `authority` |
