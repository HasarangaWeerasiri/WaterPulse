# Task Management Testing Guide

This directory contains comprehensive unit and integration tests for the Task Management feature of the WaterPulse application.

## 📁 Test Structure

```
task_Tests/
├── unit/                      # Unit tests for individual functions
│   └── taskService.test.js
├── integration/               # Integration tests for API endpoints
│   └── taskEndpoints.test.js
├── performance/               # Performance & load tests
│   ├── benchmarks.js
│   ├── loadTest.artillery.yml
│   ├── loadTestProcessor.js
│   ├── memoryProfile.js
│   ├── PERFORMANCE_TESTS_GUIDE.md
│   └── README.md
└── README.md                  # This file
```

## 🚀 Setup & Installation

### 1. Install Jest (if not already installed)

```bash
cd backend
npm install --save-dev jest @babel/preset-env babel-jest
npm install --save-dev supertest  # For integration testing
```

### 2. Configure Jest

Add to `backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:task:unit": "jest tests/task_Tests/unit",
    "test:task:integration": "jest tests/task_Tests/integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "services/taskService.js",
      "controllers/taskController.js",
      "models/task.js"
    ],
    "testMatch": [
      "**/tests/**/*.test.js"
    ]
  }
}
```

## 📋 Test Coverage

### Unit Tests (`taskService.test.js`)

#### createTask
- ✅ Creates task with all required fields
- ✅ Throws error when report does not exist
- ✅ Throws error when report is already Resolved
- ✅ Throws error when active task already exists for the report (duplicate prevention)
- ✅ Throws error when assignedTo user does not exist
- ✅ Throws error when assignedTo user is not an authority
- ✅ Throws error when assignedBy user does not exist
- ✅ Throws error when assignedBy user is not an admin
- ✅ Defaults priority to 'medium' when not provided
- ✅ Updates report to 'In Progress' when status is 'Unverified'
- ✅ Does not block task creation when notification fails

#### getTasks
- ✅ Fetches all tasks without filters
- ✅ Filters by status
- ✅ Filters by priority
- ✅ Filters by assignedTo (authority ID)
- ✅ Filters by reportId
- ✅ Sorts by priority descending then createdAt descending
- ✅ Throws error on database failure
- ✅ Returns empty array when no tasks match

#### getTaskById
- ✅ Fetches a single task by ID
- ✅ Throws 'Task not found' for non-existent task

#### getTasksByAuthority
- ✅ Fetches all tasks for a specific authority
- ✅ Filters by status when provided
- ✅ Sorts by priority descending then createdAt descending
- ✅ Throws error on database failure

#### updateTaskStatus
- ✅ Updates status from pending to in_progress
- ✅ Sets completedAt when status is completed
- ✅ Throws error when task not found
- ✅ Throws Forbidden error when authority edits someone else's task
- ✅ Requires cancellation reason when authority cancels
- ✅ Allows authority to cancel with a valid reason
- ✅ Allows admin to cancel without a reason
- ✅ Restores report to Unverified when task is cancelled
- ✅ Does not block status update when notification fails

#### updateTask
- ✅ Updates task title
- ✅ Updates task priority
- ✅ Throws error for invalid priority
- ✅ Throws error when task not found
- ✅ Updates description and resolutionNotes
- ✅ Reassigns only to existing authority users
- ✅ Throws error when new assignee does not exist
- ✅ Throws error when new assignee is not an authority

#### deleteTask
- ✅ Deletes task and restores report to Unverified
- ✅ Throws 'Task not found' for non-existent task

#### getAuthorities
- ✅ Fetches all authority users
- ✅ Sorts alphabetically by last name → first name
- ✅ Returns empty array when no authorities exist
- ✅ Throws error on database failure

### Integration Tests (`taskEndpoints.test.js`)

#### Task Creation Flow (POST /api/tasks)
- ✅ Creates task and returns 201 with task data
- ✅ Returns 400 when reportId is missing
- ✅ Returns 400 when assignedTo is missing
- ✅ Returns 400 when title is missing
- ✅ Returns 400 for invalid priority
- ✅ Accepts all valid priority values (low, medium, high)
- ✅ Defaults priority to medium when not provided
- ✅ Includes optional dueDate when provided
- ✅ Returns 400 when report not found
- ✅ Returns 400 when report is already Resolved

#### Get All Tasks (GET /api/tasks)
- ✅ Returns all tasks with 200 and count
- ✅ Filters by status query parameter
- ✅ Filters by priority query parameter
- ✅ Filters by assignedTo query parameter
- ✅ Filters by reportId query parameter
- ✅ Returns empty list when no matches
- ✅ Returns 500 on database error

#### Get Task By ID (GET /api/tasks/:id)
- ✅ Returns single task with populated fields
- ✅ Returns 404 for non-existent task
- ✅ Returns 500 on server errors

#### Get My Tasks (GET /api/tasks/my-tasks)
- ✅ Returns 403 for non-authority users
- ✅ Returns tasks for the authenticated authority
- ✅ Filters by status when query provided
- ✅ Returns 500 on server error

#### Update Task Status (PUT /api/tasks/:id/status)
- ✅ Updates task status and returns 200
- ✅ Returns 400 when status is missing
- ✅ Returns 400 for invalid status
- ✅ Accepts all valid statuses
- ✅ Returns 404 when task not found
- ✅ Returns 403 when authority edits another user's task
- ✅ Passes cancellationReason to service

#### Update Task Fields (PUT /api/tasks/:id)
- ✅ Updates fields successfully
- ✅ Returns 404 for non-existent task
- ✅ Returns 400 for invalid priority
- ✅ Returns 400 when new assignee is not an authority
- ✅ Updates resolutionNotes field

#### Delete Task (DELETE /api/tasks/:id)
- ✅ Deletes task and returns 200
- ✅ Returns 404 for non-existent task
- ✅ Returns 500 on server error
- ✅ Logs errors to console

#### Get Authorities (GET /api/tasks/authorities)
- ✅ Returns list of authority users with count
- ✅ Returns empty list when no authorities
- ✅ Returns 500 on database failure

#### Role-Based Authorization
- ✅ POST accepts admin requests
- ✅ GET accessible to admin users
- ✅ my-tasks restricted to authority users
- ✅ DELETE accessible to admin (middleware-protected)

#### Error Scenarios
- ✅ Handles database connection errors in getTasks
- ✅ Handles invalid ObjectId for getTaskById
- ✅ Logs errors to console
- ✅ Handles service timeouts in updateTaskStatus

#### Edge Cases
- ✅ Handles task with no description
- ✅ Passes cancellationReason (with whitespace) to service
- ✅ Handles undefined dueDate in updateTask
- ✅ Returns count 0 when no tasks match combined filters

## 🏃 Running Tests

### Run All Task Tests
```bash
npm run test:task
```

### Run Unit Tests Only
```bash
npm run test:task:unit
```

### Run Integration Tests Only
```bash
npm run test:task:integration
```

### Run Tests in Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## 📊 Expected Test Results

When all tests pass, you should see output like:

```
PASS  tests/task_Tests/unit/taskService.test.js
PASS  tests/task_Tests/integration/taskEndpoints.test.js

Test Suites: 2 passed, 2 total
Tests:       60+ passed, 60+ total
Snapshots:   0 total
Time:        2.5s
```

## 🛠️ Mocking Strategy

### Mocked Dependencies

```javascript
jest.mock("../../../models/task.js");
jest.mock("../../../models/contaminationReport.js");
jest.mock("../../../models/user.js");
jest.mock("../../../services/notificationService.js");
jest.mock("../../../services/taskService.js");
```

This allows tests to:
- Run without database connection
- Test in isolation without real email/notification services
- Control behavior with `mockResolvedValue()`, `mockRejectedValue()`

## 🚨 Common Issues & Fixes

### Issue: `Cannot find module` errors
**Fix**: Ensure paths in jest.mock() match your actual file locations

### Issue: Tests timeout
**Fix**: Increase Jest timeout in package.json:
```json
"jest": {
  "testTimeout": 10000
}
```

### Issue: Mock not working as expected
**Fix**: Clear mocks between tests:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 📚 References

- [Jest Documentation](https://jestjs.io/)
- [Supertest for HTTP Testing](https://github.com/visionmedia/supertest)
- [MongoDB Testing with Mongoose](https://mongoosejs.com/docs/testing/)

## 💡 Next Steps

After unit and integration testing passes, consider:
1. **Performance Testing** - Already has folder at `performance/`
2. **Load Testing** - Use Artillery with the provided `loadTest.artillery.yml`
3. **CI/CD Integration** - Integrate tests into GitHub Actions
4. **Code Coverage Analysis** - Aim for >80% coverage

---

**Happy Testing! 🎉**

For questions or issues, refer to the main WaterPulse README.md
