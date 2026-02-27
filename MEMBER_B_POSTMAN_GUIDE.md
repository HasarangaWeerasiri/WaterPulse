# Water Quality Log (Member B) - Postman Testing Guide

## Overview
This guide provides complete instructions for testing the Water Quality Log (WaterLog) backend API using Postman. The WaterLog system tracks water quality metrics (pH, turbidity) and automatically calculates safety ratings while syncing contamination reports.

---

## 1. Environment Setup

### Base URL
```
http://localhost:5000
```

### Environment Variables to Create in Postman
1. **baseUrl**: `http://localhost:5000`
2. **adminToken**: Your JWT token (admin user)
3. **authorityToken**: Your JWT token (authority user)
4. **citizenToken**: Your JWT token (citizen user)
5. **logId**: Water log ID from create endpoint (will be set during tests)
6. **reportId**: Contamination report ID (will be retrieved from reports)

---

## 2. Authentication Setup

### Step 1: Get JWT Tokens

#### Register Test Users (if not already done)

**Admin User Registration:**
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@waterpulse.com",
  "password": "admin@123",
  "role": "admin"
}
```

**Authority User Registration:**
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Authority",
  "lastName": "Officer",
  "email": "authority@waterpulse.com",
  "password": "authority@123",
  "role": "authority"
}
```

**Citizen User Registration:**
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Citizen",
  "lastName": "Reporter",
  "email": "citizen@waterpulse.com",
  "password": "citizen@123",
  "role": "citizen"
}
```

#### Login to Get Tokens

**Login as Admin:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@waterpulse.com",
  "password": "admin@123"
}
```

**Response:** (Copy the `token` value to `{{adminToken}}`)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "firstName": "Admin",
    "email": "admin@waterpulse.com",
    "role": "admin"
  }
}
```

**Login as Authority:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "authority@waterpulse.com",
  "password": "authority@123"
}
```

**Login as Citizen:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "citizen@waterpulse.com",
  "password": "citizen@123"
}
```

### Step 2: Add Authorization Header

For every WaterLog API request, add:
```
Authorization: Bearer {{adminToken}}
```
(Replace `{{adminToken}}` with `{{authorityToken}}` or `{{citizenToken}}` as needed)

---

## 3. Complete Workflow Test Case

### Objective: Demonstrate Log Creation with Report Status Sync

### **Test Case 1: GET Pending Reports (Find a Report to Link)**

**Endpoint:**
```
GET {{baseUrl}}/api/reports/pending
```

**Headers:**
```
Authorization: Bearer {{authorityToken}}
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
{
  "message": "Pending reports retrieved successfully",
  "count": 2,
  "reports": [
    {
      "_id": "67a1234567890abc12345678",
      "title": "Water discoloration in Downtown",
      "description": "Water appears brownish",
      "status": "Unverified",
      "address": "Downtown District, City",
      "reportedBy": {
        "_id": "67a0987654321cba98765432",
        "firstName": "Citizen",
        "email": "citizen@waterpulse.com",
        "role": "citizen"
      },
      "createdAt": "2025-02-20T10:30:00Z"
    }
  ]
}
```

**Action:** Copy the `_id` value to `{{reportId}}`

---

### **Test Case 2: POST Create Water Log with Unsafe Metrics**

This test demonstrates the auto-validation and cross-model status sync.

**Endpoint:**
```
POST {{baseUrl}}/api/logs
```

**Headers:**
```
Authorization: Bearer {{authorityToken}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "region": "Downtown District",
  "phLevel": 5.2,
  "turbidity": 12.5,
  "contaminants": ["iron", "manganese"],
  "reportId": "{{reportId}}"
}
```

**Expected Response (201 Created):**
```json
{
  "message": "Water log created successfully",
  "log": {
    "_id": "67b2345678901def23456789",
    "region": "Downtown District",
    "phLevel": 5.2,
    "turbidity": 12.5,
    "contaminants": ["iron", "manganese"],
    "safetyRating": "Unsafe",
    "recordedBy": {
      "_id": "67a1111111111111111111111",
      "firstName": "Authority",
      "lastName": "Officer",
      "email": "authority@waterpulse.com",
      "role": "authority"
    },
    "reportId": {
      "_id": "67a1234567890abc12345678",
      "title": "Water discoloration in Downtown",
      "status": "Confirmed",
      "location": {
        "type": "Point",
        "coordinates": [-74.0060, 40.7128]
      }
    },
    "recordedAt": "2025-02-20T15:45:22Z",
    "createdAt": "2025-02-20T15:45:22Z",
    "updatedAt": "2025-02-20T15:45:22Z"
  }
}
```

**Action:** Copy the log `_id` to `{{logId}}`

---

### **Test Case 3: VERIFY Report Status Has Changed to "Confirmed"**

**Endpoint:**
```
GET {{baseUrl}}/api/reports/{{reportId}}
```

**Headers:**
```
Authorization: Bearer {{authorityToken}}
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
{
  "_id": "67a1234567890abc12345678",
  "title": "Water discoloration in Downtown",
  "description": "Water appears brownish",
  "status": "Confirmed",
  "address": "Downtown District, City",
  "reportedBy": {
    "_id": "67a0987654321cba98765432",
    "firstName": "Citizen",
    "lastName": "Reporter",
    "email": "citizen@waterpulse.com",
    "role": "citizen"
  },
  "createdAt": "2025-02-20T10:30:00Z",
  "updatedAt": "2025-02-20T15:45:22Z"
}
```

**Verification:** Status has changed from `Unverified` to `Confirmed` - ✅ Success

---

## 4. CRUD Operations Reference

### CREATE: POST /api/logs

**Endpoint:**
```
POST {{baseUrl}}/api/logs
```

**Restriction:** Authority or Admin only

**Request Body Example (Safe Water):**
```json
{
  "region": "Suburban Zone A",
  "phLevel": 7.0,
  "turbidity": 2.3,
  "contaminants": [],
  "reportId": "67a1234567890abc12345678"
}
```

**Expected Response:** 201 Created
```json
{
  "message": "Water log created successfully",
  "log": {
    "_id": "67b3456789012efg34567890",
    "region": "Suburban Zone A",
    "phLevel": 7.0,
    "turbidity": 2.3,
    "contaminants": [],
    "safetyRating": "Safe",
    "recordedBy": {...},
    "reportId": {
      "_id": "67a1234567890abc12345678",
      "status": "Resolved"
    },
    "recordedAt": "2025-02-20T16:00:00Z"
  }
}
```

**Note:** For Safe rating, report status changes to "Resolved"

---

### READ ALL: GET /api/logs

**Endpoint:**
```
GET {{baseUrl}}/api/logs
```

**Restriction:** All authenticated users

**Optional Query Parameters:**
```
?region=Downtown District
?safetyRating=Unsafe
?region=Downtown District&safetyRating=Warning
```

**Example with Filters:**
```
GET {{baseUrl}}/api/logs?region=Downtown District&safetyRating=Unsafe
```

**Expected Response:** 200 OK
```json
{
  "message": "Water logs retrieved successfully",
  "count": 3,
  "logs": [
    {
      "_id": "67b2345678901def23456789",
      "region": "Downtown District",
      "phLevel": 5.2,
      "turbidity": 12.5,
      "contaminants": ["iron", "manganese"],
      "safetyRating": "Unsafe",
      "recordedBy": {...},
      "reportId": {...},
      "recordedAt": "2025-02-20T15:45:22Z"
    }
  ]
}
```

---

### READ BY ID: GET /api/logs/:id

**Endpoint:**
```
GET {{baseUrl}}/api/logs/{{logId}}
```

**Restriction:** All authenticated users

**Expected Response:** 200 OK
```json
{
  "message": "Water log retrieved successfully",
  "log": {
    "_id": "67b2345678901def23456789",
    "region": "Downtown District",
    "phLevel": 5.2,
    "turbidity": 12.5,
    "safetyRating": "Unsafe",
    "recordedBy": {
      "_id": "...",
      "firstName": "Authority",
      "email": "authority@waterpulse.com"
    },
    "recordedAt": "2025-02-20T15:45:22Z"
  }
}
```

---

### UPDATE: PATCH /api/logs/:id

**Endpoint:**
```
PATCH {{baseUrl}}/api/logs/{{logId}}
```

**Restriction:** Admin only

**Request Body (Update pH and Turbidity - Re-calculates Safety Rating):**
```json
{
  "phLevel": 6.8,
  "turbidity": 4.2
}
```

**Expected Response:** 200 OK
```json
{
  "message": "Water log updated successfully",
  "log": {
    "_id": "67b2345678901def23456789",
    "region": "Downtown District",
    "phLevel": 6.8,
    "turbidity": 4.2,
    "safetyRating": "Safe",
    "recordedBy": {...},
    "reportId": {
      "_id": "67a1234567890abc12345678",
      "status": "Resolved"
    },
    "recordedAt": "2025-02-20T15:45:22Z",
    "updatedAt": "2025-02-20T16:30:00Z"
  }
}
```

**Note:** Safety rating is automatically recalculated and report status is re-synced

---

### DELETE: DELETE /api/logs/:id

**Endpoint:**
```
DELETE {{baseUrl}}/api/logs/{{logId}}
```

**Restriction:** Admin only

**Expected Response:** 200 OK
```json
{
  "message": "Water log deleted successfully",
  "log": {
    "_id": "67b2345678901def23456789",
    "region": "Downtown District",
    "phLevel": 6.8,
    "safetyRating": "Safe"
  }
}
```

---

## 5. Analytics Endpoints

### GET Trends by Region: GET /api/logs/analytics/trends

**Endpoint:**
```
GET {{baseUrl}}/api/logs/analytics/trends
```

**Restriction:** All authenticated users

**Optional Query Parameters:**
```
?region=Downtown District    (Filter specific region)
?months=6                     (Default: 12, Range: 1-24)
```

**Example:**
```
GET {{baseUrl}}/api/logs/analytics/trends?region=Downtown District&months=12
```

**Expected Response:** 200 OK
```json
{
  "message": "Analytics trends retrieved successfully",
  "filters": {
    "region": "Downtown District",
    "months": 12
  },
  "data": [
    {
      "_id": {
        "region": "Downtown District",
        "month": "2025-02"
      },
      "avgPH": 6.15,
      "avgTurbidity": 8.12,
      "safeCount": 2,
      "warningCount": 3,
      "unsafeCount": 5,
      "totalCount": 10
    },
    {
      "_id": {
        "region": "Downtown District",
        "month": "2025-01"
      },
      "avgPH": 7.45,
      "avgTurbidity": 3.87,
      "safeCount": 8,
      "warningCount": 1,
      "unsafeCount": 1,
      "totalCount": 10
    }
  ]
}
```

---

### GET By Region: GET /api/logs/region/:region

**Endpoint:**
```
GET {{baseUrl}}/api/logs/region/Downtown District
```

**Restriction:** All authenticated users

**Expected Response:** 200 OK
```json
{
  "message": "Water logs for region retrieved successfully",
  "region": "Downtown District",
  "count": 8,
  "logs": [...]
}
```

---

## 6. Error Handling & Edge Cases

### Error Case 1: Unauthorized - No Token

**Request:**
```
GET {{baseUrl}}/api/logs
(No Authorization header)
```

**Response:** 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

---

### Error Case 2: Forbidden - Citizen Tries to Create Log

**Request:**
```
POST {{baseUrl}}/api/logs
Authorization: Bearer {{citizenToken}}
Content-Type: application/json

{
  "region": "Test Region",
  "phLevel": 7.0,
  "turbidity": 2.0
}
```

**Response:** 403 Forbidden
```json
{
  "message": "You do not have permission to access this resource"
}
```

**Explanation:** Only authority and admin can create water logs

---

### Error Case 3: Forbidden - Authority Tries to Update Log

**Request:**
```
PATCH {{baseUrl}}/api/logs/{{logId}}
Authorization: Bearer {{authorityToken}}
Content-Type: application/json

{
  "phLevel": 7.5
}
```

**Response:** 403 Forbidden
```json
{
  "message": "You do not have permission to access this resource"
}
```

**Explanation:** Only admin can update logs

---

### Error Case 4: Forbidden - Authority Tries to Delete Log

**Request:**
```
DELETE {{baseUrl}}/api/logs/{{logId}}
Authorization: Bearer {{authorityToken}}
```

**Response:** 403 Forbidden
```json
{
  "message": "You do not have permission to access this resource"
}
```

**Explanation:** Only admin can delete logs

---

### Error Case 5: Invalid pH Value

**Request:**
```
POST {{baseUrl}}/api/logs
Authorization: Bearer {{authorityToken}}
Content-Type: application/json

{
  "region": "Test",
  "phLevel": 15.5,
  "turbidity": 2.0
}
```

**Response:** 400 Bad Request
```json
{
  "message": "phLevel must be between 0 and 14"
}
```

---

### Error Case 6: Invalid Turbidity Value

**Request:**
```
POST {{baseUrl}}/api/logs
Authorization: Bearer {{authorityToken}}
Content-Type: application/json

{
  "region": "Test",
  "phLevel": 7.0,
  "turbidity": -1
}
```

**Response:** 400 Bad Request
```json
{
  "message": "turbidity must be a non-negative number"
}
```

---

### Error Case 7: Missing Required Fields

**Request:**
```
POST {{baseUrl}}/api/logs
Authorization: Bearer {{authorityToken}}
Content-Type: application/json

{
  "region": "Test"
}
```

**Response:** 400 Bad Request
```json
{
  "message": "region, phLevel, and turbidity are required"
}
```

---

### Error Case 8: Log Not Found

**Request:**
```
GET {{baseUrl}}/api/logs/invalid_id_12345
Authorization: Bearer {{authorityToken}}
```

**Response:** 404 Not Found
```json
{
  "message": "Water log not found"
}
```

---

## 7. Safety Rating Calculation Reference

The system automatically calculates safety ratings based on water quality metrics:

| Metric | Safe Range | Warning Range | Unsafe |
|--------|-----------|---------------|---------|
| **pH** | 6.5 - 8.5 | 6.0 - 6.4 or 8.6 - 9.0 | < 6.0 or > 9.0 |
| **Turbidity (NTU)** | ≤ 5 | 5.1 - 10 | > 10 |

**Safety Rating Logic:**
- **Safe**: Both pH AND Turbidity are in safe range
- **Unsafe**: Either pH OR Turbidity is in unsafe range
- **Warning**: At least one metric is slightly outside safe range (but not unsafe)

**Report Status Sync:**
- Safe Water → Report Status: **Resolved**
- Unsafe Water → Report Status: **Confirmed**
- Warning Water → Report Status: **No automatic change**

---

## 8. Postman Collection Setup

### Import Variables
In Postman, create a new environment with these variables:

```json
{
  "name": "WaterPulse Local",
  "values": [
    {"key": "baseUrl", "value": "http://localhost:5000", "enabled": true},
    {"key": "adminToken", "value": "", "enabled": true},
    {"key": "authorityToken", "value": "", "enabled": true},
    {"key": "citizenToken", "value": "", "enabled": true},
    {"key": "logId", "value": "", "enabled": true},
    {"key": "reportId", "value": "", "enabled": true}
  ]
}
```

### Test Script (Optional - Auto-set Variables)
Add this script to login requests:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  if (response.token) {
    if (pm.request.name.includes("Admin")) {
      pm.environment.set("adminToken", response.token);
    } else if (pm.request.name.includes("Authority")) {
      pm.environment.set("authorityToken", response.token);
    } else if (pm.request.name.includes("Citizen")) {
      pm.environment.set("citizenToken", response.token);
    }
  }
}
```

---

## 9. Summary of Endpoints

| Method | Endpoint | Role Restriction | Purpose |
|--------|----------|------------------|---------|
| POST | /api/logs | Authority, Admin | Create water log |
| GET | /api/logs | All Authenticated | Fetch all logs |
| GET | /api/logs/:id | All Authenticated | Get specific log |
| PATCH | /api/logs/:id | Admin | Update log |
| DELETE | /api/logs/:id | Admin | Delete log |
| GET | /api/logs/analytics/trends | All Authenticated | Get trends |
| GET | /api/logs/region/:region | All Authenticated | Get region logs |

---

## 10. Key Features Demonstrated

✅ **Auto-Validation**: pH and turbidity levels are automatically validated
✅ **Safety Rating Calculation**: Automatic calculation based on water quality metrics
✅ **Cross-Model Sync**: Report status automatically updates when water log is created/updated
✅ **Role-Based Access Control (RBAC)**: Different endpoints restricted by user role
✅ **Error Handling**: Meaningful error messages for all edge cases
✅ **Analytics Engine**: MongoDB aggregation for trend analysis
✅ **Data Integrity**: Admin-only update/delete to protect scientific data

---

**End of Postman Testing Guide**
