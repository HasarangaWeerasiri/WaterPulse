# WaterPulse - Full-Stack Water Resource Management System

A **production-ready full-stack application** for managing water contamination reports, task assignment, water quality logs, and safe water source discovery. Features **JWT authentication**, **role-based access control**, **MongoDB geospatial queries**, and modern dashboards.

**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Endpoint Documentation](#api-endpoint-documentation)
- [Database Models](#database-models)
- [Architecture & Patterns](#architecture--patterns)
- [Third-Party Integrations](#third-party-integrations)
- [Testing Instructions](#testing-instructions)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)

---

## 🎯 Project Overview

**WaterPulse** is a comprehensive water resource management system designed for managing contamination issues, task coordination, and safe water source discovery. The platform supports three user roles with distinct capabilities:

### Key Features

- ✅ **Contamination Reporting** - Citizens report water quality issues with location-based mapping
- ✅ **Task Management** - Admins create and assign investigation tasks to authorities
- ✅ **Water Quality Logging** - Authorities record pH, turbidity, and contamination data
- ✅ **Safe Zone Directory** - Maintain and locate clean/safe water sources (tankers, wells, etc.)
- ✅ **Geospatial Search** - Find nearby water sources and contaminated areas on maps
- ✅ **Role-Based Access Control** - Citizen, Authority, and Admin roles with granular permissions
- ✅ **Email & SMS Notifications** - Send alerts via Resend (email) and SMS8 (SMS)
- ✅ **PDF Report Generation** - Export contamination reports as PDFs
- ✅ **Weather Integration** - Real-time contamination risk assessment using OpenWeatherMap
- ✅ **Analytics & Trends** - Water quality trends and monthly safety metrics by region

### Demo Accounts

```
Role        | Email                | Password
------------|---------------------|----------
Citizen     | citizen@test.com     | password123
Authority   | authority@test.com   | password123
Admin       | admin@test.com       | password123
```

---

## 🛠 Tech Stack

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.2.1
- **Database:** MongoDB 9.2.1 (Mongoose ODM)
- **Authentication:** JWT (jsonwebtoken 9.0.0) with 7-day expiration
- **Password Security:** bcryptjs 2.4.3 (10 salt rounds)
- **HTTP Client:** axios 1.13.5 (for third-party API calls)
- **Email Service:** Resend 6.9.2 (async email delivery)
- **PDF Generation:** pdfkit 0.18.0
- **Utilities:** dotenv 17.3.1 (environment configuration)
- **CORS:** cors 2.8.6

### Frontend

- **Framework:** React 19.2.0
- **Router:** react-router-dom 6.20.1
- **Styling:** Tailwind CSS 4.1.18 with Vite plugin
- **Build Tool:** Vite 7.3.1
- **HTTP Client:** axios 1.6.5
- **Animations:** framer-motion 12.38.0
- **Maps:** Leaflet 1.9.4 & react-leaflet 5.0.0
- **Icons:** lucide-react 1.0.1

### Testing & Development

- **Test Framework:** Jest 29.5.0
- **Integration Testing:** supertest 6.3.3
- **Load Testing:** Artillery 2.0.0
- **Benchmarking:** autocannon 7.10.0
- **Dev Server:** nodemon 3.1.11
- **Linting:** ESLint 9.39.1

---

## 🏗 System Architecture

```
WaterPulse/
├── backend/                          [Express.js + MongoDB]
│   ├── controllers/                  [Business Logic]
│   │   ├── authController.js         [Authentication & user creation]
│   │   ├── reportController.js       [Contamination report CRUD]
│   │   ├── taskController.js         [Task management]
│   │   ├── waterLogController.js     [Water quality logging]
│   │   └── safeZoneController.js     [Safe water source directory]
│   │
│   ├── routes/                       [API Route Definitions]
│   │   ├── authRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── waterLogRoutes.js
│   │   └── safeZoneRoutes.js
│   │
│   ├── models/                       [MongoDB Schemas]
│   │   ├── user.js                   [User with role enum]
│   │   ├── contaminationReport.js    [Report + GeoJSON location]
│   │   ├── task.js                   [Task with cancellation tracking]
│   │   ├── waterLog.js               [Quality metrics + timestamps]
│   │   └── safeZone.js               [Safe source + availability]
│   │
│   ├── middleware/                   [Authentication & Authorization]
│   │   └── authMiddleware.js         [JWT verification, role checking]
│   │
│   ├── services/                     [Utility & Integration Logic]
│   │   ├── emailService.js           [Resend email integration]
│   │   ├── smsService.js             [SMS8 SMS integration]
│   │   ├── reportPdfService.js       [PDF generation]
│   │   ├── reportService.js          [Report business logic]
│   │   ├── taskService.js            [Task business logic]
│   │   ├── waterLogService.js        [Log validation & analytics]
│   │   ├── analyticsService.js       [Data aggregation]
│   │   └── notificationService.js    [Multi-channel notifications]
│   │
│   ├── tests/                        [Jest Test Suites]
│   │   ├── waterLogs_Tests/          [WaterLog unit & integration]
│   │   ├── task_Tests/               [Task unit & integration]
│   │   └── setup.js                  [Shared test config]
│   │
│   ├── server.js                     [Express app initialization]
│   ├── seed.js                       [Database seeding]
│   ├── jest.config.js
│   ├── package.json
│   └── .env                          [Environment variables]
│
└── frontend/                         [React + Vite]
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx       [Global auth state + token mgmt]
    │   │
    │   ├── components/
    │   │   ├── Navbar.jsx            [Navigation bar]
    │   │   ├── ProtectedRoute.jsx    [Role-based route guard]
    │   │   ├── reports/              [Report components]
    │   │   └── tasks/                [Task components]
    │   │
    │   ├── pages/
    │   │   ├── LandingPage.jsx       [Public landing]
    │   │   ├── UnauthorizedPage.jsx  [403 error page]
    │   │   ├── user/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   ├── dashboard/
    │   │   │   ├── HomePage.jsx      [Citizen dashboard]
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   └── AuthorityDashboard.jsx
    │   │   └── citizen/
    │   │       ├── ReportCenter.jsx
    │   │       └── ReportsMapPage.jsx
    │   │
    │   ├── services/                 [API Client Layer]
    │   │   ├── reportApi.js
    │   │   ├── taskApi.js
    │   │   ├── waterLogApi.js
    │   │   └── safeZoneApi.js
    │   │
    │   ├── App.jsx                   [Router configuration]
    │   ├── main.jsx
    │   ├── App.css
    │   └── index.css
    │
    ├── vite.config.js
    ├── tailwind.config.js
    ├── eslint.config.js
    └── package.json
```

---

## 📚 Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **MongoDB** 5.x+ (local or MongoDB Atlas)
- **Git** for version control
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Verify Installation

```bash
# Check versions
node --version    # Should be v18+
npm --version     # Should be 9+
git --version

# Create test directory
mkdir test-waterpulse && cd test-waterpulse
```

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone [PLACEHOLDER_REPO_URL]
cd WaterPulse
```

### 2. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env  # If available, or create manually

# Verify MongoDB connection in .env
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/waterpulse

# Start MongoDB Atlas cluster or local MongoDB
# mongod

# Seed database with demo data
npm run seed

# Start backend server (with hot reload via nodemon)
npm start
# Server runs on http://localhost:5000
```

### 3. Set Up Frontend

```bash
# From project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Verify Setup

- Backend: `curl http://localhost:5000/api/health`
- Frontend: Open http://localhost:5173 in browser
- Login with demo account (e.g., citizen@test.com / password123)

---

## 🔑 Environment Variables

### Backend `.env` (Required)

```bash
# ========== SERVER ==========
PORT=5000
NODE_ENV=development

# ========== DATABASE ==========
# MongoDB Atlas URL or local MongoDB
MONGO_URI

# ========== SECURITY ==========
# JWT Secret (change in production to strong random string)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET

# ========== EMAIL SERVICE (Resend) ==========
# Get API key from: https://resend.com
RESEND_API_KEY
RESEND_FROM_EMAIL

# ========== WEATHER & LOCATION SERVICE ==========
# OpenWeatherMap: https://openweathermap.org (free tier: 1000 calls/day)
OPENWEATHER_API_KEY

# Nominatim (OpenStreetMap) - Free, no key required
# User-Agent for Nominatim requests
NOMINATIM_USER_AGENT

# ========== SMS SERVICE (SMS8.io) ==========
# Get API key from: https://sms8.io
SMS8_API_KEY
SMS8_DEVICE_ID
```

### Frontend `.env` (Optional - for production)

```bash
# API base URL (defaults to http://localhost:5000/api if not set)
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📡 API Endpoint Documentation

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new citizen user.

| Property          | Value |
| ----------------- | ----- |
| **Auth Required** | No    |
| **Role Required** | None  |

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+94712345678",
  "city": "Colombo",
  "district": "Western"
}
```

**Response `201`:**

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "citizen"
  }
}
```

**Validation Rules:**

- Email must be unique
- Phone number must follow Sri Lankan format (0XXXXXXXXX or +94XXXXXXXXX)
- Password is hashed with bcrypt (10 salt rounds)
- Default role: `citizen`

---

#### POST `/api/auth/login`

Authenticate user and receive JWT token.

| Property          | Value |
| ----------------- | ----- |
| **Auth Required** | No    |
| **Role Required** | None  |

**Request Body:**

```json
{
  "email": "citizen@test.com",
  "password": "password123"
}
```

**Response `200`:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Citizen",
    "lastName": "User",
    "email": "citizen@test.com",
    "role": "citizen"
  }
}
```

**Error `401`:**

```json
{
  "message": "Invalid email or password"
}
```

**Token Details:**

- Expires: 7 days
- Algorithm: HS256
- Payload: `{ userId, email, role }`

---

#### POST `/api/auth/create-admin-authority`

Create a new admin or authority user (admin only).

| Property          | Value                               |
| ----------------- | ----------------------------------- |
| **Auth Required** | No (temporary - for initial setup)  |
| **Role Required** | None (use for first admin creation) |

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "authority@example.com",
  "password": "password123",
  "role": "authority",
  "phoneNumber": "+94712345679",
  "city": "Colombo",
  "district": "Western"
}
```

**Response `201`:**

```json
{
  "message": "Admin/Authority user created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "authority@example.com",
    "role": "authority"
  }
}
```

---

#### GET `/api/auth/me`

Get current authenticated user profile.

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response `200`:**

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "citizen",
    "phoneNumber": "+94712345678",
    "location": {
      "city": "Colombo",
      "district": "Western"
    },
    "joinedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### Contamination Report Endpoints

#### POST `/api/reports`

Submit a new contamination report (citizens only).

| Property          | Value     |
| ----------------- | --------- |
| **Auth Required** | ✅ Yes    |
| **Role Required** | `citizen` |

**Request Body:**

```json
{
  "title": "Water Discoloration",
  "description": "Water from main tap is brown and smells odd",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "imageUrl": "https://example.com/image.jpg",
  "address": "123 Galle Road, Colombo"
}
```

**Response `201`:**

```json
{
  "message": "Report created successfully",
  "report": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Water Discoloration",
    "description": "Water from main tap is brown and smells odd",
    "status": "Unverified",
    "location": {
      "type": "Point",
      "coordinates": [79.8612, 6.9271]
    },
    "address": "123 Galle Road, Colombo",
    "reportedBy": "507f1f77bcf86cd799439011",
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
}
```

**Status Enum:** `Unverified` | `In Progress` | `Confirmed` | `Resolved` | `Spam`

---

#### GET `/api/reports/all`

Get all reports (admin & authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

**Response `200`:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Water Discoloration",
    "description": "...",
    "status": "Confirmed",
    "location": { "type": "Point", "coordinates": [79.8612, 6.9271] },
    "reportedBy": {
      "firstName": "John",
      "email": "john@example.com",
      "role": "citizen"
    },
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
]
```

---

#### GET `/api/reports/my-reports`

Get reports submitted by current citizen.

| Property          | Value     |
| ----------------- | --------- |
| **Auth Required** | ✅ Yes    |
| **Role Required** | `citizen` |

**Response `200`:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Water Discoloration",
    ...
  }
]
```

---

#### GET `/api/reports/confirmed`

Get all confirmed contamination reports (any authenticated user).

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

---

#### GET `/api/reports/pending`

Get all pending reports awaiting action (admin & authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

---

#### GET `/api/reports/:id`

Get a single report by ID.

| Property          | Value                                |
| ----------------- | ------------------------------------ |
| **Auth Required** | ✅ Yes                               |
| **Role Required** | None (citizens see only own reports) |

---

#### GET `/api/reports/:id/pdf`

Download report as PDF.

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

**Response:** PDF file download

---

#### GET `/api/reports/all/pdf`

Download all reports as a single PDF (admin & authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

---

#### PUT `/api/reports/:id`

Update report details (citizens: own reports only, admin/authority: any).

| Property          | Value                                       |
| ----------------- | ------------------------------------------- |
| **Auth Required** | ✅ Yes                                      |
| **Role Required** | `citizen` (own only) or `admin`/`authority` |

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "location": { "coordinates": [79.8612, 6.9271] }
}
```

---

#### PUT `/api/reports/:id/status`

Update report status only (admin & authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

**Request Body:**

```json
{
  "status": "Confirmed"
}
```

**Valid Status Values:** `Unverified` | `In Progress` | `Confirmed` | `Resolved` | `Spam`

---

### Task Management Endpoints

#### POST `/api/tasks`

Create a new task (admin only).

| Property          | Value   |
| ----------------- | ------- |
| **Auth Required** | ✅ Yes  |
| **Role Required** | `admin` |

**Request Body:**

```json
{
  "reportId": "507f1f77bcf86cd799439013",
  "assignedTo": "507f1f77bcf86cd799439012",
  "priority": "high",
  "title": "Pipe Investigation",
  "description": "Investigate contamination source and identify solution",
  "dueDate": "2026-03-01"
}
```

**Response `201`:**

```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439020",
    "reportId": "507f1f77bcf86cd799439013",
    "assignedTo": "507f1f77bcf86cd799439012",
    "assignedBy": "507f1f77bcf86cd799439010",
    "priority": "high",
    "status": "pending",
    "title": "Pipe Investigation",
    "description": "...",
    "dueDate": "2026-03-01",
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
}
```

**Priority Enum:** `low` | `medium` | `high`  
**Status Enum:** `pending` | `in_progress` | `completed` | `cancelled`

---

#### GET `/api/tasks`

Get all tasks with optional filters (admin only).

| Property          | Value   |
| ----------------- | ------- |
| **Auth Required** | ✅ Yes  |
| **Role Required** | `admin` |

**Query Parameters:**

- `assignedTo`: Filter by authority ID
- `status`: Filter by status
- `priority`: Filter by priority
- `reportId`: Filter by report

**Example:** `GET /api/tasks?status=pending&priority=high`

---

#### GET `/api/tasks/authorities`

Get list of all authority users for assignment (admin only).

| Property          | Value   |
| ----------------- | ------- |
| **Auth Required** | ✅ Yes  |
| **Role Required** | `admin` |

**Response `200`:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "authority@example.com",
    "role": "authority"
  }
]
```

---

#### GET `/api/tasks/my-tasks`

Get tasks assigned to current authority user.

| Property          | Value       |
| ----------------- | ----------- |
| **Auth Required** | ✅ Yes      |
| **Role Required** | `authority` |

---

#### GET `/api/tasks/:id`

Get a single task by ID.

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

---

#### PUT `/api/tasks/:id`

Update task fields (admin only).

| Property          | Value   |
| ----------------- | ------- |
| **Auth Required** | ✅ Yes  |
| **Role Required** | `admin` |

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": "medium",
  "dueDate": "2026-03-05"
}
```

---

#### PUT/PATCH `/api/tasks/:id/status`

Update task status (admin: any task, authority: own tasks).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

**Request Body (Authority - Cancellation):**

```json
{
  "status": "cancelled",
  "cancellationReason": "Resource unavailable"
}
```

**Request Body (Authority - Completion):**

```json
{
  "status": "completed",
  "resolutionNotes": "Pipe was replaced successfully"
}
```

---

#### DELETE `/api/tasks/:id`

Delete a task permanently (admin only).

| Property          | Value   |
| ----------------- | ------- |
| **Auth Required** | ✅ Yes  |
| **Role Required** | `admin` |

---

### Water Quality Log Endpoints

#### POST `/api/logs`

Create a new water quality log (authority & admin only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `authority` or `admin` |

**Request Body:**

```json
{
  "region": "Colombo District",
  "phLevel": 6.5,
  "turbidity": 2.3,
  "contaminants": ["Iron", "Manganese"],
  "reportId": "507f1f77bcf86cd799439013"
}
```

**Response `201`:**

```json
{
  "message": "Water log created successfully",
  "log": {
    "_id": "507f1f77bcf86cd799439025",
    "region": "Colombo District",
    "phLevel": 6.5,
    "turbidity": 2.3,
    "contaminants": ["Iron", "Manganese"],
    "safetyRating": "Safe",
    "recordedBy": "507f1f77bcf86cd799439012",
    "recordedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

**Safety Rating Logic:**

- `Safe`: pH 6.5-8.5 AND turbidity < 1
- `Warning`: pH 5-9 OR turbidity 1-5
- `Unsafe`: Otherwise

---

#### GET `/api/logs`

Get all water logs with optional filters.

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

**Query Parameters:**

- `region`: Filter by region
- `safetyRating`: Filter by rating (`Safe`, `Warning`, `Unsafe`)

**Example:** `GET /api/logs?region=Colombo&safetyRating=Safe`

---

#### GET `/api/logs/:id`

Get a single water log by ID.

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

---

#### GET `/api/logs/region/:region`

Get all logs for a specific region.

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

---

#### GET `/api/logs/analytics/trends`

Get water quality trends and monthly metrics (aggregation pipeline).

| Property          | Value  |
| ----------------- | ------ |
| **Auth Required** | ✅ Yes |
| **Role Required** | None   |

**Query Parameters:**

- `region`: Filter by region (optional)
- `months`: Number of months to analyze (optional, default: 12)

**Response `200`:**

```json
{
  "message": "Analytics data retrieved successfully",
  "trends": [
    {
      "_id": "2026-02",
      "region": "Colombo",
      "avgPh": 6.8,
      "avgTurbidity": 2.1,
      "safeCount": 15,
      "warningCount": 3,
      "unsafeCount": 1
    }
  ]
}
```

---

#### PATCH `/api/logs/:id`

Update a water log (admin only).

| Property          | Value   |
| ----------------- | ------- |
| **Auth Required** | ✅ Yes  |
| **Role Required** | `admin` |

**Request Body:**

```json
{
  "phLevel": 7.0,
  "turbidity": 1.5,
  "contaminants": ["Iron"]
}
```

---

#### DELETE `/api/logs/:id`

Delete a water log (admin only).

| Property          | Value   |
| ----------------- | ------- |
| **Auth Required** | ✅ Yes  |
| **Role Required** | `admin` |

---

### Safe Zone (Clean Water Source) Endpoints

#### GET `/api/safe-zones/all`

Get all safe zones (public, no auth required).

| Property          | Value |
| ----------------- | ----- |
| **Auth Required** | No    |
| **Role Required** | None  |

**Response `200`:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439030",
    "name": "Navam Mawatha Tanker",
    "type": "Tanker",
    "description": "Free water tanker near junction",
    "location": { "type": "Point", "coordinates": [79.8612, 6.9271] },
    "address": "Navam Mawatha, Colombo 02",
    "isAvailable": true,
    "createdBy": {
      "firstName": "Admin",
      "email": "admin@example.com"
    },
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
]
```

---

#### GET `/api/safe-zones/nearby`

Get nearby safe zones within specified radius (public, no auth required).

| Property          | Value |
| ----------------- | ----- |
| **Auth Required** | No    |
| **Role Required** | None  |

**Query Parameters:**

- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `maxDistance`: Distance in meters (optional, default: 10000)
- `limit`: Max number of results (optional, default: 5)

**Example:** `GET /api/safe-zones/nearby?lat=6.9271&lng=79.8612&maxDistance=5000&limit=10`

---

#### GET `/api/safe-zones/my-zones`

Get safe zones created by current user (auth & admin/authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

---

#### GET `/api/safe-zones/:id`

Get a single safe zone by ID.

| Property          | Value |
| ----------------- | ----- |
| **Auth Required** | No    |
| **Role Required** | None  |

---

#### GET `/api/safe-zones/:id/weather`

Get real-time weather and contamination risk for a safe zone.

| Property          | Value |
| ----------------- | ----- |
| **Auth Required** | No    |
| **Role Required** | None  |

**Response `200`:**

```json
{
  "weather": {
    "temperature": 28,
    "humidity": 75,
    "description": "Partly cloudy",
    "windSpeed": 5
  },
  "contaminationRisk": "Low"
}
```

**Uses:** OpenWeatherMap API to fetch real-time weather data

---

#### POST `/api/safe-zones`

Create a new safe zone (admin & authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

**Request Body:**

```json
{
  "name": "Colombo Water Tanker",
  "type": "Tanker",
  "description": "Emergency water supply",
  "latitude": 6.9271,
  "longitude": 79.8612
}
```

**Type Enum:** `Tanker` | `Well` | `Filter` | `Tap` | `Borehole` | `Other`

---

#### PUT `/api/safe-zones/:id`

Update a safe zone (admin & authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

**Request Body:**

```json
{
  "name": "Updated Name",
  "isAvailable": false,
  "description": "Currently empty"
}
```

---

#### DELETE `/api/safe-zones/:id`

Delete a safe zone (admin & authority only).

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Auth Required** | ✅ Yes                 |
| **Role Required** | `admin` or `authority` |

---

## 🗄 Database Models

### User Model

```javascript
{
  firstName: String,           // Required
  lastName: String,            // Required
  email: String,               // Required, unique
  password: String,            // Hashed with bcrypt (10 salt rounds)
  role: Enum,                  // 'citizen' | 'authority' | 'admin' (default: 'citizen')
  phoneNumber: String,         // Required, unique, Sri Lankan format validation
  location: {
    city: String,
    district: String
  },
  joinedAt: Date               // Default: Date.now
}
```

---

### Contamination Report Model

```javascript
{
  title: String,               // Required
  description: String,         // Required
  imageUrl: String,            // Optional
  address: String,             // Auto-filled via Nominatim geocoding
  status: Enum,                // 'Unverified' | 'In Progress' | 'Confirmed' | 'Resolved' | 'Spam'
  location: {                  // GeoJSON Point for geospatial queries
    type: "Point",
    coordinates: [longitude, latitude]
  },
  reportedBy: ObjectId,        // Reference to User (required)
  createdAt: Date,             // Auto
  updatedAt: Date              // Auto
}
```

---

### Task Model

```javascript
{
  reportId: ObjectId,          // Reference to ContaminationReport (required, indexed)
  assignedTo: ObjectId,        // Reference to User (authority) (required, indexed)
  assignedBy: ObjectId,        // Reference to User (admin)
  priority: Enum,              // 'low' | 'medium' | 'high' (default: 'medium')
  status: Enum,                // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  title: String,               // Required
  description: String,
  dueDate: Date,
  completedAt: Date,           // Set when status = 'completed'
  cancellationReason: String,  // Set when cancelled
  cancelledByRole: Enum,       // 'admin' | 'authority' | null
  resolutionNotes: String,     // Notes on completion/resolution
  createdAt: Date,             // Auto
  updatedAt: Date              // Auto
}
```

---

### Water Log Model

```javascript
{
  region: String,              // Region name (indexed for queries)
  reportId: ObjectId,          // Reference to ContaminationReport (optional)
  phLevel: Number,             // 0-14 (required, validated)
  turbidity: Number,           // >= 0 NTU (required, validated)
  contaminants: [String],      // List of contaminants (default: [])
  safetyRating: Enum,          // 'Safe' | 'Warning' | 'Unsafe' (auto-calculated)
  recordedBy: ObjectId,        // Reference to User (required)
  recordedAt: Date,            // Timestamp (indexed)
  createdAt: Date,             // Auto
  updatedAt: Date              // Auto
}
```

---

### Safe Zone Model

```javascript
{
  name: String,                // Required
  type: Enum,                  // 'Tanker' | 'Well' | 'Filter' | 'Tap' | 'Borehole' | 'Other'
  description: String,
  location: {                  // GeoJSON Point for proximity queries
    type: "Point",
    coordinates: [longitude, latitude]
  },
  address: String,             // Auto-filled via Nominatim
  isAvailable: Boolean,        // Default: true
  createdBy: ObjectId,         // Reference to User
  createdAt: Date,             // Auto
  updatedAt: Date              // Auto
}
```

---

## 🏛 Architecture & Patterns

### Authentication & Authorization

**JWT Token Flow:**

1. User logs in → `POST /api/auth/login`
2. Server returns JWT token (expires in 7 days)
3. Client stores token in `localStorage`
4. Client includes token in every request: `Authorization: Bearer <token>`
5. Server verifies token via `verifyToken` middleware

**Middleware:** `backend/middleware/authMiddleware.js`

```javascript
// Verify token presence and validity
export const verifyToken = (req, res, next) => { ... }

// Check if user's role is allowed
export const checkRole = (allowedRoles) => (req, res, next) => { ... }
```

### Role-Based Access Control (RBAC)

| Role          | Permissions                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Citizen**   | • Create reports • View own reports • View confirmed reports • View safe zones & weather                                                                               |
| **Authority** | • All citizen permissions • View all reports (pending/confirmed) • Create/update water logs • View assigned tasks • Create/update/cancel own tasks • Manage safe zones |
| **Admin**     | • All authority permissions • Create authority/admin users • Create/update/delete all tasks • Update/delete water logs • Export reports as PDF                         |

---

### State Management (Frontend)

**AuthContext Pattern:**

```javascript
// contexts/AuthContext.jsx
- Stores: user, token, loading, errors, initializing
- Methods: login(), register(), logout()
- Persists token in localStorage
- Auto-verifies token on app load
- Sets axios default Authorization header
```

**Protected Routes:**

```javascript
<ProtectedRoute allowedRoles={["citizen"]}>
  <HomePage />
</ProtectedRoute>
```

---

### API Client Layer (Frontend)

Centralized API calls via service files:

- `reportApi.js` - Contamination report operations
- `taskApi.js` - Task management
- `waterLogApi.js` - Water quality logging
- `safeZoneApi.js` - Safe zone directory

All use `axios` with automatic Authorization header injection.

---

### Service Layer (Backend)

Business logic separated from HTTP concerns:

- `reportService.js` - Report validation & operations
- `taskService.js` - Task creation & status updates
- `waterLogService.js` - Log validation & analytics
- `emailService.js` - Email delivery via Resend
- `smsService.js` - SMS delivery via SMS8
- `reportPdfService.js` - PDF generation
- `analyticsService.js` - Data aggregation

---

## 🔗 Third-Party Integrations

### 1. **Resend** - Email Delivery

- **Service:** Transactional email delivery
- **API:** REST (send emails to recipients)
- **Free Tier:** 3,000 emails/month
- **Env Variable:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **Usage:** `emailService.sendEmail({ to, subject, html, text })`

### 2. **SMS8.io** - SMS Gateway

- **Service:** Send SMS alerts to mobile numbers
- **API:** HTTP POST with form-encoded parameters
- **Usage:** `smsService.sendAlert(phoneNumber, message)`
- **Env Variables:** `SMS8_API_KEY`, `SMS8_DEVICE_ID`
- **Supported Format:** Sri Lankan (+94XXXXXXXXX) or local (0XXXXXXXXX)

### 3. **OpenWeatherMap** - Weather Data

- **Service:** Real-time weather + contamination risk calculation
- **API:** REST with API key
- **Free Tier:** 1,000 calls/day
- **Env Variable:** `OPENWEATHER_API_KEY`
- **Used in:** Safe zone weather endpoint `/api/safe-zones/:id/weather`

### 4. **Nominatim** - Reverse Geocoding

- **Service:** Convert GPS coordinates to addresses (OpenStreetMap)
- **API:** REST (no API key required)
- **Env Variable:** `NOMINATIM_USER_AGENT`
- **Used in:** Report creation and safe zone creation to auto-fill addresses

---

## 🧪 Testing Instructions

### Unit & Integration Tests

```bash
cd backend

# Run all tests
npm test

# Run only waterLog tests
npm test -- tests/waterLogs_Tests

# Unit tests
npm test -- tests/waterLogs_Tests/unit

# Integration tests
npm test -- tests/waterLogs_Tests/integration

# Task tests
npm test -- tests/task_Tests

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

**Test Files:**

- `tests/waterLogs_Tests/unit/waterLogService.test.js` - Service layer validation
- `tests/waterLogs_Tests/integration/waterLogEndpoints.test.js` - API endpoints
- `tests/task_Tests/unit/taskService.test.js` - Task service logic
- `tests/task_Tests/integration/taskEndpoints.test.js` - Task API endpoints

**Framework:** Jest 29.5.0  
**Integration Testing:** supertest (real HTTP requests)  
**Test Environment:** Node with MongoDB in-memory or test database

---

### Performance Testing

```bash
cd backend

# Load testing (Artillery)
npm run perf:waterlog:load   # Runs waterLogs_Tests/performance/loadTest.artillery.yml
npm run perf:task:load       # Runs task_Tests/performance/loadTest.artillery.yml

# Benchmarking
npm run perf:waterlog:benchmark
npm run perf:task:benchmark

# Memory profiling
npm run perf:waterlog:memory
npm run perf:task:memory

# All performance tests
npm run perf:waterlog:all
npm run perf:task:all
```

**Tools:**

- **Artillery:** Load/stress testing (YAML scenarios)
- **autocannon:** HTTP benchmarking
- **Node.js profiler:** Memory usage analysis

---

## 🚀 Deployment Guide

### Backend Deployment (Node.js + MongoDB)

#### Option 1: Railway (Recommended)

1. **Create Railway Account** → railway.app
2. **Connect GitHub repository**
3. **Add Environment Variables** in Railway dashboard:
   - `MONGO_URI` (from MongoDB Atlas)
   - `JWT_SECRET` (strong random string)
   - `PORT` (Railway auto-assigns)
   - `RESEND_API_KEY`, `OPENWEATHER_API_KEY`, etc.
4. **Deploy triggers automatically** on git push

#### Option 2: Render

1. Create account at render.com
2. New Web Service → Connect GitHub
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables

#### Option 3: Heroku (if still available)

```bash
heroku create [app-name]
git push heroku main
heroku config:set JWT_SECRET=[value]
heroku config:set MONGO_URI=[mongodb_url]
```

---

### Frontend Deployment (React + Vite)

#### Vercel (Recommended)

1. **Create Vercel Account** → vercel.com
2. **Connect GitHub repository**
3. **Build Settings:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. **Add Environment Variable:**
   - `VITE_API_BASE_URL`: [PLACEHOLDER_BACKEND_URL]
5. **Deploy** → automatic on git push

#### Netlify

```bash
# Build locally
npm run build

# Deploy via CLI
netlify deploy --prod --dir dist
```

#### GitHub Pages

```bash
# Add to vite.config.js
export default {
  base: '/WaterPulse/',
  ...
}

npm run build
git add dist/ && git commit -m "Build"
git subtree push --prefix dist origin gh-pages
```

---

### Database Setup (MongoDB Atlas)

1. Create cluster at mongodb.com/cloud/atlas
2. Create database user with strong password
3. Add IP whitelist (0.0.0.0/0 for development, specific IPs for production)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/waterpulse`
5. Add to backend `.env` as `MONGO_URI`

---

## 🔍 Troubleshooting

### Backend Won't Start

```bash
# Check Node version
node --version   # Should be 18+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if port 5000 is in use
lsof -i :5000    # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process and restart
npm start
```

### MongoDB Connection Failed

```bash
# Test MongoDB connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/test"

# Check .env has correct MONGO_URI
cat .env | grep MONGO_URI

# Verify MongoDB Atlas allows your IP
# MongoDB Atlas Dashboard → Network Access → IP Whitelist
```

### Frontend Can't Connect to Backend

```bash
# 1. Verify backend is running
curl http://localhost:5000/api/health

# 2. Check frontend .env (or vite.config.js)
# VITE_API_BASE_URL=http://localhost:5000/api

# 3. Check CORS settings in backend/server.js
# Should allow frontend URL

# 4. Check browser console for CORS errors
# DevTools → Console → Network tab
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Check test setup
cat backend/tests/setup.js

# Ensure test DB is running
# Tests use MONGODB_URI from setup.js
```

### JWT Token Expired

```javascript
// Token expires after 7 days
// Solution: User must login again
// Frontend clears token from localStorage and redirects to login
```

---

## 📚 Git Workflow

### Branch Structure

```
main                          [Production-ready code]
  ├── develop                 [Integration branch]
  │   ├── feature/auth        [New authentication feature]
  │   ├── feature/reports     [Report management]
  │   ├── bugfix/cors-issue   [Bug fix]
  │   └── release/v1.0.1      [Release preparation]
```

### Commit Guidelines

```bash
# Feature branch
git checkout -b feature/new-feature
git commit -m "feat: Add new feature description"

# Bug fix
git commit -m "fix: Resolve issue with..."

# Documentation
git commit -m "docs: Update README"

# Testing
git commit -m "test: Add unit tests for..."

# Merge to develop
git push origin feature/new-feature
# Create Pull Request on GitHub
# After review: merge to develop

# Release to main
git checkout main
git merge develop
git tag -a v1.0.1 -m "Version 1.0.1"
git push origin main --tags
```

---

## 👥 Contributors

- **[PLACEHOLDER_CONTRIBUTOR_1]** - Backend (Authentication, Reports)
- **[PLACEHOLDER_CONTRIBUTOR_2]** - Backend (Tasks, Water Logs)
- **[PLACEHOLDER_CONTRIBUTOR_3]** - Backend (Safe Zones, Integrations)
- **[PLACEHOLDER_CONTRIBUTOR_4]** - Frontend (React Components, UI)
- **[PLACEHOLDER_CONTRIBUTOR_5]** - Testing & QA

---

## 📄 License

ISC License - See LICENSE file for details

---

## 🤝 Support

For issues, questions, or suggestions:

1. Check existing [PLACEHOLDER_ISSUES_URL]
2. Create new GitHub issue with details
3. Contact team via [PLACEHOLDER_CONTACT_EMAIL]

---

## 📖 Additional Documentation

- [SAFE_ZONE.md](SAFE_ZONE.md) - Safe zone directory details
- [TaskManagement_GUIDE.md](TaskManagement_GUIDE.md) - Task workflow
- [WaterLogs_Guide.md](<WaterLogs_Guide(AI\ generated).md>) - Water log analytics
- [SMS_Service_Guide.md](SMS_Service_Guide.md) - SMS integration guide
- [TESTING_GUIDE.md](backend/TESTING_GUIDE.md) - Detailed testing documentation
- [WaterPulse_API.postman_collection.json](WaterPulse_API.postman_collection.json) - Postman collection for API testing

---

**Last Updated:** April 8, 2026  
**Maintained By:** [PLACEHOLDER_TEAM]

````

### Route Protection
```javascript
// Frontend: ProtectedRoute component checks auth + role
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>

// Backend: Middleware verifies JWT on API calls
app.get('/protected', verifyToken, handler);
````

---

## 🎯 User Flows

### Registration Flow

1. User → Register Page
2. Fill form with details
3. Password gets hashed on backend
4. User record created in MongoDB
5. JWT token generated
6. Auto-login to `/home` dashboard

### Login Flow

1. User → Login Page
2. Enter email & password
3. Backend verifies credentials
4. JWT token generated
5. Auto-redirect based on role:
   - Citizen → `/home`
   - Authority → `/authority-dashboard`
   - Admin → `/admin-dashboard`

### Session Persistence

1. JWT stored in browser localStorage
2. Automatically added to API headers
3. Survives page refresh
4. Cleared on logout

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api/auth`

| Method | Endpoint                | Public | Purpose                  |
| ------ | ----------------------- | ------ | ------------------------ |
| POST   | /register               | ✅     | Register new citizen     |
| POST   | /login                  | ✅     | User authentication      |
| POST   | /create-admin-authority | ✅     | Create admin/authority\* |
| GET    | /me                     | ❌     | Get current user         |

\*Protected in production

---

## 🎨 UI Features

All pages built with **Tailwind CSS** for modern, responsive design

---

## 🛠️ Tech Stack

### Backend

- Express.js, MongoDB, Mongoose, Bcryptjs, JWT, CORS

### Frontend

- React, React Router, Axios, Tailwind CSS

---

## ✨ Features Included

### Security

- [x] JWT Authentication
- [x] Bcrypt password hashing
- [x] Protected routes
- [x] CORS configured

### Frontend

- [x] Modern UI pages
- [x] Role-based dashboards
- [x] Form validation
- [x] Session persistence

### Backend

- [x] User registration
- [x] Authentication
- [x] Admin/Authority creation
- [x] Database integration

---

## 📚 Documentation Files

| File               | Purpose                         |
| ------------------ | ------------------------------- |
| **QUICKSTART.md**  | Fast 5-minute setup guide       |
| **SETUP_GUIDE.md** | Complete detailed documentation |
| **STATUS.md**      | Full feature completion report  |

---

## 🚀 Ready to Go!

1. Read **QUICKSTART.md**
2. Run the quick start commands
3. Login with demo credentials
4. Explore the dashboards!

**Your complete authentication system is ready!** 🎉
