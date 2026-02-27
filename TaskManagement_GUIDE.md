# Task Management — Postman Testing Guide

Base URL: `http://localhost:5000`

---

## 1. Authentication Setup

All task endpoints require a JWT token. Pass it as a **Bearer Token** in every request:

| Header | Value |
|---|---|
| `Authorization` | `Bearer <your_token_here>` |
| `Content-Type` | `application/json` |

### Login as Admin

**POST** `http://localhost:5000/api/auth/login`

```json
{
  "email": "admin@waterpulse.com",
  "password": "yourpassword"
}
```

Copy the `token` from the response → use as `admin_token`.

---

### Login as Authority

**POST** `http://localhost:5000/api/auth/login`

```json
{
  "email": "authority@waterpulse.com",
  "password": "yourpassword"
}
```

Copy the `token` from the response → use as `authority_token`.

---

## 2. Workflow Test Cases

### Step 1 — Get Pending Reports (find a Report ID to assign)

**GET** `http://localhost:5000/api/reports/pending`
- Auth: `admin_token`

Copy a report `_id` from the response — this is your `REPORT_ID`.

---

### Step 2 — Get List of Authorities (find an Authority ID to assign)

**GET** `http://localhost:5000/api/tasks/authorities`
- Auth: `admin_token`

Copy an authority `_id` from the response — this is your `AUTHORITY_ID`.

---

### Step 3 — Create a Task (Admin assigns report to authority)

**POST** `http://localhost:5000/api/tasks`
- Auth: `admin_token`

**Body:**
```json
{
  "reportId": "<REPORT_ID>",
  "assignedTo": "<AUTHORITY_ID>",
  "priority": "high",
  "title": "Pipe Repair",
  "description": "Investigate and repair the contaminated pipe at the reported location.",
  "dueDate": "2026-03-15"
}
```

**Expected result:**
- `201 Created`
- Task is created and linked to the report
- Report status changes from `Unverified` → `Confirmed`
- Report disappears from Pending Reports
- Authority receives an assignment email
- Citizen receives a report acknowledgement email

Copy the task `_id` from the response — this is your `TASK_ID`.

---

### Step 4 — Verify Report Is No Longer Pending

**GET** `http://localhost:5000/api/reports/pending`
- Auth: `admin_token`

The assigned report should **not** appear in this list.

---

### Step 5 — Try Assigning the Same Report Again (Duplicate Prevention)

**POST** `http://localhost:5000/api/tasks` (same body as Step 3)
- Auth: `admin_token`

**Expected result:**
- `400 Bad Request`
- Message: `"This report is already assigned as an active task and cannot be assigned again"`

---

### Step 6 — Authority Views Their Assigned Tasks

**GET** `http://localhost:5000/api/tasks/my-tasks`
- Auth: `authority_token`

**Expected result:**
- Only tasks assigned to this specific authority are returned

---

### Step 7 — Update Task Status to In-Progress (Authority)

**PUT** `http://localhost:5000/api/tasks/<TASK_ID>/status`
- Auth: `authority_token`

**Body:**
```json
{
  "status": "in_progress"
}
```

**Expected result:**
- Task status → `in_progress`
- Report status auto-updates to `Confirmed` (if still `Unverified`)

---

### Step 8 — Verify Report Status Synced

**GET** `http://localhost:5000/api/reports/all`
- Auth: `admin_token`

Find the report by `_id` — its status should reflect the task progress.

---

### Step 9 — Update Task Status to Completed (Authority)

**PUT** `http://localhost:5000/api/tasks/<TASK_ID>/status`
- Auth: `authority_token`

**Body:**
```json
{
  "status": "completed"
}
```

**Expected result:**
- Task status → `completed`
- `completedAt` timestamp is set
- Admin receives a task completion email
- Citizen receives a "Your report has been resolved" email

---

### Step 10 — Cancel a Task (With Reason Required)

#### Try without a reason (expect error):

**PUT** `http://localhost:5000/api/tasks/<TASK_ID>/status`
- Auth: `authority_token`

**Body:**
```json
{
  "status": "cancelled"
}
```

**Expected result:**
- `400 Bad Request`
- Message: `"A cancellation reason is required when cancelling a task"`

#### Cancel with a reason:

**Body:**
```json
{
  "status": "cancelled",
  "cancellationReason": "Equipment unavailable at this location"
}
```

**Expected result:**
- Task status → `cancelled`
- Report status → `Unverified` (reappears in Pending Reports)
- Report is assignable again

---

### Step 11 — Edit a Task (Admin Only)

**PUT** `http://localhost:5000/api/tasks/<TASK_ID>`
- Auth: `admin_token`

**Body:**
```json
{
  "priority": "medium",
  "title": "Updated Task Title",
  "description": "Updated description",
  "resolutionNotes": "Pipe repaired and water quality confirmed safe."
}
```

---

### Step 12 — Delete a Task (Admin Only)

**DELETE** `http://localhost:5000/api/tasks/<TASK_ID>`
- Auth: `admin_token`

**Expected result:**
- `200 OK` — Task deleted
- Linked report status → `Unverified` (reappears in Pending Reports)
- Report is assignable again

---

### Step 13 — Admin Views All Tasks

**GET** `http://localhost:5000/api/tasks`
- Auth: `admin_token`

Returns all tasks across all authorities.

Optional query filters:
```
GET /api/tasks?status=in_progress
GET /api/tasks?priority=high
GET /api/tasks?assignedTo=<AUTHORITY_ID>
```

---

## 3. Security Tests

### Citizen cannot view tasks

Run this with a **citizen token**:

**GET** `http://localhost:5000/api/tasks`
- Auth: `citizen_token`

**Expected result:**
- `403 Forbidden`
- Message: `"You do not have permission to access this resource"`

---

### Authority cannot create tasks

**POST** `http://localhost:5000/api/tasks`
- Auth: `authority_token`

**Expected result:**
- `403 Forbidden`

---

### Authority cannot update another authority's task

Log in as **Authority A**, get a task assigned to **Authority B**, then:

**PUT** `http://localhost:5000/api/tasks/<AUTHORITY_B_TASK_ID>/status`
- Auth: `authority_A_token`

**Body:**
```json
{
  "status": "in_progress"
}
```

**Expected result:**
- `403 Forbidden`
- Message: `"Forbidden: You can only update tasks assigned to you"`

---

### Task creation blocked for Resolved report

If a report's status is already `Resolved`, attempting to create a task for it returns:

**Expected result:**
- `400 Bad Request`
- Message: `"Cannot create a task for a report that is already Resolved"`

---

## 4. Quick Reference

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/tasks` | Admin | Create a task |
| GET | `/api/tasks` | Admin | View all tasks |
| GET | `/api/tasks/my-tasks` | Authority | View own tasks |
| GET | `/api/tasks/:id` | Admin, Authority | View single task |
| GET | `/api/tasks/authorities` | Admin | List all authorities |
| PUT | `/api/tasks/:id/status` | Admin, Authority | Update task status |
| PUT | `/api/tasks/:id` | Admin | Edit task fields |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| GET | `/api/reports/pending` | Admin, Authority | View pending reports |
| GET | `/api/reports/all` | Admin, Authority | View all reports |
