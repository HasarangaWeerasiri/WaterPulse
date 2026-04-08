# WaterLogs Testing Guide

This directory contains comprehensive unit and integration tests for the WaterLogs feature of the WaterPulse application.

## 📁 Test Structure

```
waterLogs_Tests/
├── unit/                      # Unit tests for individual functions
│   └── waterLogService.test.js
├── integration/               # Integration tests for API endpoints
│   └── waterLogEndpoints.test.js
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
    "test:unit": "jest tests/waterLogs_Tests/unit",
    "test:integration": "jest tests/waterLogs_Tests/integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "services/waterLogService.js",
      "controllers/waterLogController.js",
      "models/waterLog.js"
    ],
    "testMatch": [
      "**/tests/**/*.test.js"
    ]
  }
}
```

## 📋 Test Coverage

### Unit Tests (`waterLogService.test.js`)

#### pH & Turbidity Validation
- ✅ Valid pH range (0-14)
- ✅ Valid turbidity range (≥0)
- ✅ Boundary conditions (0, 14, exactly 5 NTU)
- ✅ Invalid ranges and types

#### Safety Rating Calculation
- ✅ **Safe**: pH 6.5-8.5 & Turbidity ≤5 NTU
- ✅ **Warning**: Slightly outside safe ranges
- ✅ **Unsafe**: pH <6.0 or >9.0, Turbidity >10
- ✅ Edge cases and boundaries

#### Database Queries
- ✅ `getAllLogs()` - fetch all, filter by region, filter by safety rating
- ✅ `getLogById()` - fetch single log, handle not found
- ✅ `getLogsByRegion()` - fetch region-specific logs
- ✅ Sorting by `recordedAt` (most recent first)
- ✅ Error handling on DB failures

#### SMS Notification Logic
- ✅ Send SMS when water marked Safe
- ✅ Send SMS when water marked Unsafe
- ✅ Don't send SMS for Warning status
- ✅ Handle missing phone numbers
- ✅ Non-blocking failure (SMS errors don't block log creation)
- ✅ Message formatting with name and location

### Integration Tests (`waterLogEndpoints.test.js`)

#### Log Creation Flow (POST /api/logs)
- ✅ Create log with all required fields
- ✅ Auto-calculate safety rating (Safe, Warning, Unsafe)
- ✅ Validate missing phLevel & turbidity (400 error)
- ✅ Validate numeric types (400 error)
- ✅ Validate pH range 0-14 (400 error)
- ✅ Validate turbidity ≥0 (400 error)
- ✅ Include optional reportId
- ✅ Error handling for service failures

#### Role-Based Authorization
- ✅ POST endpoint (authority/admin can create)
- ✅ GET endpoints (all authenticated users can read)
- ✅ PATCH endpoint (admin only, protected by middleware)
- ✅ DELETE endpoint (admin only, protected by middleware)

#### Filtering & Retrieval
- ✅ Fetch all logs without filters
- ✅ Filter by region query parameter
- ✅ Filter by safetyRating query parameter
- ✅ Combine multiple filters
- ✅ Get logs by specific region endpoint
- ✅ Return empty list for no matches
- ✅ Return 404 for non-existent log IDs
- ✅ Populate user and report references

#### Cross-Model Interactions
- ✅ Update contamination report status when log marked Unsafe
- ✅ Update contamination report status when log marked Safe
- ✅ Auto-complete associated task on resolution
- ✅ Don't change report status on Warning rating
- ✅ Recalculate safety rating on log update
- ✅ Sync report status when updating changes rating
- ✅ Link water log to contamination report

#### Update & Delete Operations
- ✅ Update log with single field (phLevel or turbidity)
- ✅ Update log with multiple fields
- ✅ Validate update data (at least one field required)
- ✅ Validate phLevel range on update
- ✅ Validate turbidity on update
- ✅ Delete log successfully
- ✅ Return 404 on deleting non-existent log

#### Error Scenarios
- ✅ Handle database connection failures
- ✅ Handle service timeouts
- ✅ Handle invalid ObjectId format
- ✅ Log errors to console for debugging

#### Edge Cases
- ✅ Logs with null region
- ✅ Empty contaminants array
- ✅ Multiple contaminants
- ✅ Floating point precision for pH and turbidity

## 🏃 Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
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
PASS  tests/waterLogs_Tests/unit/waterLogService.test.js
PASS  tests/waterLogs_Tests/integration/waterLogEndpoints.test.js

Test Suites: 2 passed, 2 total
Tests:       50+ passed, 50+ total
Snapshots:   0 total
Time:        2.5s
```

## 🔍 Test Details

### Unit Testing Focus

**Safety Rating Validation** - Critical business logic
- Tests all combinations of pH and turbidity
- Validates boundary conditions
- Ensures correct rating classification

**Database Operations** - Data access layer
- Tests query filters and sorting
- Validates error handling
- Tests population of references

**SMS Notifications** - External integrations
- Mocks SMS service to avoid real calls
- Tests message formatting
- Validates conditions for sending

### Integration Testing Focus

**Request/Response Cycles**
- Validates input validation at endpoint
- Tests response status codes
- Verifies response payload structure

**Business Logic Flow**
- Cross-model interactions (logs ↔ reports)
- Automatic status updates
- Task completion triggers

**Authorization**
- Role-based access control
- Proper HTTP status codes (401, 403)
- Middleware integration

## 🛠️ Mocking Strategy

### Mocked Dependencies

```javascript
jest.mock("./models/waterLog.js");
jest.mock("./models/contaminationReport.js");
jest.mock("./models/task.js");
jest.mock("./services/smsService.js");
```

This allows tests to:
- Run without database connection
- Test in isolation without external services
- Control behavior with `mockResolvedValue()`, `mockRejectedValue()`

## 📝 Writing New Tests

To add new tests to these files:

1. **For unit tests**: Add to `unit/waterLogService.test.js`
   ```javascript
   describe("New Feature", () => {
     test("should do something", () => {
       // Arrange
       const input = { phLevel: 7, turbidity: 3 };
       
       // Act
       const result = waterLogService.calculateSafetyRating(
         input.phLevel,
         input.turbidity
       );
       
       // Assert
       expect(result).toBe("Safe");
     });
   });
   ```

2. **For integration tests**: Add to `integration/waterLogEndpoints.test.js`
   ```javascript
   test("should handle new scenario", async () => {
     mockReq.body = { /* test data */ };
     mockRes.status.mockReturnValue(mockRes);
     
     await someController(mockReq, mockRes);
     
     expect(mockRes.status).toHaveBeenCalledWith(200);
   });
   ```

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
2. **Load Testing** - Use Artillery or JMeter
3. **CI/CD Integration** - Integrate tests into GitHub Actions
4. **Code Coverage Analysis** - Aim for >80% coverage

---

**Happy Testing! 🎉**

For questions or issues, refer to the main WaterPulse README.md
