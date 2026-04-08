# Contamination Report - Testing Guide

This guide explains how to run and understand the tests for the **Contamination Report** module in the WaterPulse backend.

## 1. Prerequisites

- Node.js installed
- Backend dependencies installed:
  - From the `backend` directory:
    - `npm install`

All tests use **Jest**. Integration tests use **Supertest**. Performance tests use **Artillery**.

## 2. Test Structure

- Unit tests (service layer)
  - `tests/contaminationReport_Tests/unit/reportService.test.js`
- Integration tests (HTTP endpoints with Supertest)
  - `tests/contaminationReport_Tests/integration/reportEndpoints.test.js`
- Performance tests (Artillery)
  - `tests/contaminationReport_Tests/performance/reportPerformance.test.yml`

## 3. Unit Tests – reportService

File: `tests/contaminationReport_Tests/unit/reportService.test.js`

Covers:
- `getPendingReports()`
  - Filters by `status: "Unverified"`
  - Populates `reportedBy` fields
  - Sorts by `createdAt` descending (latest first)
  - Wraps and rethrows database errors
- `getPendingReportsCount()`
  - Counts documents where `status: "Unverified"`
  - Wraps and rethrows database errors

MongoDB is **fully mocked** via the `ContaminationReport` model – no real database connection is used.

### Run only unit tests for reports

From `backend`:

```bash
npx jest tests/contaminationReport_Tests/unit/reportService.test.js
```

## 4. Integration Tests – Report Endpoints

File: `tests/contaminationReport_Tests/integration/reportEndpoints.test.js`

Uses **Supertest** against an in-memory Express app which mounts `reportRoutes`.

### What is mocked

- JWT/auth:
  - `verifyToken` and `checkRole` are mocked from `middleware/authMiddleware.js`.
  - Custom headers control identity and role:
    - `x-test-user-id` – simulated user id
    - `x-test-role` – `citizen`, `admin`, or `authority`
- MongoDB:
  - `ContaminationReport`, `WaterLog`, and `Task` models are mocked (no real DB).
- External services:
  - `axios` – for reverse geocoding (OpenStreetMap)
  - `reportPdfService` – for PDF generation

### Endpoints covered

- `POST /api/reports` – create report
  - Valid request (citizen)
  - Missing required fields → `400`
  - Invalid `imageUrl` → `400`
  - Geocoding failure (axios error) still allows creation
- `GET /api/reports/all`
  - Admin/authority access allowed
  - Citizen access forbidden (`403`)
- `GET /api/reports/:id`
  - Admin can fetch any report
  - Citizen can only fetch own report
  - Non-existent / unauthorized → `404`
- `GET /api/reports/my-reports`
  - Returns reports for the logged-in citizen
- `GET /api/reports/confirmed`
  - Returns confirmed reports for any authenticated role
- `GET /api/reports/pending`
  - Admin/authority only; returns Unverified reports
  - Citizen access forbidden (`403`)
- `GET /api/reports?lat=&lng=&radius=`
  - Validates required query params → `400` if missing
  - Returns reports within radius for valid queries
- `PUT /api/reports/:id`
  - Citizen can update own **Unverified** report fields
  - Citizen cannot update someone else’s report (`403`)
  - Admin/authority can update **status only**
  - Admin update without `status` → `400`
- `PUT /api/reports/:id/status`
  - Admin/authority can update status
  - Citizen forbidden (`403`)
  - Missing `status` → `400`
- `DELETE /api/reports/:id`
  - Citizen can delete own report; cascades to `WaterLog` and `Task`
  - Citizen cannot delete others’ reports (`403`)
  - Non-existent report → `404`
- PDF endpoints (with `reportPdfService` mocked)
  - `GET /api/reports/:id/pdf`
  - `GET /api/reports/all/pdf`

### Run only integration tests for reports

From `backend`:

```bash
npx jest tests/contaminationReport_Tests/integration/reportEndpoints.test.js
```

## 5. Performance Tests – Artillery

File: `tests/contaminationReport_Tests/performance/reportPerformance.test.yml`

Simulates 50–100 concurrent-like users across phases by varying `arrivalRate`:

- Warm up (5 rps)
- Ramp up (10 rps)
- Peak load (20 rps)

Scenarios:
- Citizens creating reports via `POST /api/reports`
- Admin-style access:
  - `GET /api/reports/all`
  - `GET /api/reports/confirmed`
  - `GET /api/reports/pending`
- Geo radius queries:
  - `GET /api/reports?lat=...&lng=...&radius=...`

Response time check:
- `ensure.maxResponseTime: 1000` → basic SLA to keep responses under ~1s.

### Run performance tests

From `backend` (with server running on port 5000):

```bash
npx artillery run tests/contaminationReport_Tests/performance/reportPerformance.test.yml
```

## 6. Running All Jest Tests

From `backend`:

```bash
npm test
```

This will execute all Jest tests, including Contamination Report unit and integration tests.
