# Test Structure & Best Practices

This document explains the organization and patterns used in WaterLogs testing.

## 📋 Test Organization

### File Structure

```
tests/waterLogs_Tests/
├── unit/
│   └── waterLogService.test.js          # Service layer tests
├── integration/
│   └── waterLogEndpoints.test.js        # Controller/API tests
├── performance/ (future)
│   └── waterLogLoadTest.js
├── README.md                             # Full test documentation
└── setup.js                              # Jest configuration
```

### Test File Naming Convention

- ✅ `waterLogService.test.js` - Tests for WaterLogService class
- ✅ `waterLogEndpoints.test.js` - Tests for API endpoints/controllers
- ✅ `waterLogModel.test.js` - Tests for data models
- Pattern: `{module}.test.js`

## 🧪 Unit Test Structure

### Template: Testing a Function

```javascript
describe("Feature Name", () => {
  // SETUP: Runs before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ARRANGE + ACT + ASSERT pattern
  test("should do something expected", () => {
    // Arrange: Set up test data
    const input = { phLevel: 7, turbidity: 3 };
    
    // Act: Call the function
    const result = waterLogService.calculateSafetyRating(
      input.phLevel,
      input.turbidity
    );
    
    // Assert: Verify the result
    expect(result).toBe("Safe");
  });

  test("should handle edge case: X", () => {
    const result = waterLogService.calculateSafetyRating(6.5, 5);
    expect(result).toBe("Safe");
  });

  test("should throw error when validation fails", async () => {
    await expect(
      waterLogService.getLogById("invalid_id")
    ).rejects.toThrow("Water log not found");
  });
});
```

### Unit Test Example: Safety Rating

```javascript
describe("Safety Rating Calculation", () => {
  describe("Safe Rating", () => {
    test("should return 'Safe' when pH=7 and turbidity=3", () => {
      expect(
        waterLogService.calculateSafetyRating(7, 3)
      ).toBe("Safe");
    });

    test("should return 'Safe' at boundaries: pH=6.5, turbidity=5", () => {
      expect(
        waterLogService.calculateSafetyRating(6.5, 5)
      ).toBe("Safe");
    });
  });

  describe("Warning Rating", () => {
    test("should return 'Warning' for pH=6.0 (slightly out of range)", () => {
      expect(
        waterLogService.calculateSafetyRating(6.0, 3)
      ).toBe("Warning");
    });
  });

  describe("Unsafe Rating", () => {
    test("should return 'Unsafe' for critically low pH=5", () => {
      expect(
        waterLogService.calculateSafetyRating(5, 3)
      ).toBe("Unsafe");
    });
  });
});
```

## 🔗 Integration Test Structure

### Template: Testing an Endpoint

```javascript
describe("Endpoint Name - POST /api/logs", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock request/response
    mockReq = {
      userId: "user123",
      body: {},
      params: {},
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  test("should create log and return 201", async () => {
    // Arrange
    mockReq.body = { phLevel: 7, turbidity: 3 };
    
    const mockLog = {
      _id: "log1",
      phLevel: 7,
      turbidity: 3,
      safetyRating: "Safe"
    };
    
    waterLogService.createLog.mockResolvedValue(mockLog);

    // Act
    await createLog(mockReq, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Water log created successfully",
      log: mockLog
    });
  });

  test("should validate required fields", async () => {
    mockReq.body = { turbidity: 3 }; // Missing phLevel

    await createLog(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "phLevel and turbidity are required"
    });
  });
});
```

## 🎯 Testing Patterns

### 1. Testing Validation

```javascript
test("should reject invalid pH value", () => {
  expect(() => {
    waterLogService.calculateSafetyRating(-1, 3);
  }).not.toThrow(); // pH -1 is allowed (function handles it)
});

test("should validate pH range on request", async () => {
  mockReq.body = { phLevel: 15, turbidity: 3 }; // Invalid: pH > 14

  await createLog(mockReq, mockRes);

  expect(mockRes.status).toHaveBeenCalledWith(400);
});
```

### 2. Testing Database Operations

```javascript
test("should fetch logs sorted by most recent", async () => {
  const mockLogs = [
    { _id: "1", recordedAt: "2026-04-08" },
    { _id: "2", recordedAt: "2026-04-01" }
  ];

  // Mock the chain of methods
  WaterLog.find.mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue(mockLogs)
  });

  const result = await waterLogService.getAllLogs({});

  expect(WaterLog.find).toHaveBeenCalled();
  expect(result).toBe(mockLogs);
});
```

### 3. Testing Error Handling

```javascript
test("should handle service errors gracefully", async () => {
  waterLogService.createLog.mockRejectedValue(
    new Error("Database connection failed")
  );

  mockReq.body = { phLevel: 7, turbidity: 3 };

  await createLog(mockReq, mockRes);

  expect(mockRes.status).toHaveBeenCalledWith(500);
  expect(mockRes.json).toHaveBeenCalledWith({
    message: "Database connection failed"
  });
});
```

### 4. Testing Cross-Model Interactions

```javascript
test("should update report status when log marks water Safe", async () => {
  const reportId = "report123";
  
  mockReq.body = {
    phLevel: 7,
    turbidity: 2,
    reportId
  };

  const createdLog = {
    _id: "log1",
    safetyRating: "Safe",
    reportId
  };

  waterLogService.createLog.mockResolvedValue(createdLog);
  ContaminationReport.findById.mockResolvedValue({
    _id: reportId,
    status: "Pending"
    // Service should set status to "Resolved"
  });

  await createLog(mockReq, mockRes);

  expect(waterLogService.createLog).toHaveBeenCalledWith(
    expect.objectContaining({ reportId })
  );
});
```

### 5. Testing Async Operations

```javascript
test("should send SMS notification asynchronously", async () => {
  const phone = "+1234567890";
  
  smsService.sendAlert.mockResolvedValue({ success: true });

  mockReq.body = {
    phLevel: 7,
    turbidity: 3,
    reportId: "report1"
  };

  await createLog(mockReq, mockRes);

  // SMS sending happens in background
  expect(smsService.sendAlert).toHaveBeenCalledWith(
    phone,
    expect.stringContaining("Resolved")
  );
});

test("should not block log creation if SMS fails", async () => {
  smsService.sendAlert.mockRejectedValue(
    new Error("SMS Gateway unavailable")
  );

  mockReq.body = { phLevel: 7, turbidity: 3 };

  await createLog(mockReq, mockRes);

  // Log creation should still succeed
  expect(mockRes.status).toHaveBeenCalledWith(201);
});
```

## 📊 Mocking Best Practices

### Mocking Models

```javascript
// Mock the entire model
jest.mock("../models/waterLog.js");

// In test: Set behavior with mockResolvedValue
WaterLog.find.mockReturnValue({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([mockLog])
});

// Or for simple cases
WaterLog.findById.mockResolvedValue(mockLog);
```

### Mocking Services

```javascript
// Mock external service
jest.mock("../services/smsService.js");

// Control behavior in tests
smsService.sendAlert
  .mockResolvedValue({ success: true }) // Success case
  .mockRejectedValue(new Error("Failed")); // Error case
```

### Resetting Mocks Between Tests

```javascript
beforeEach(() => {
  jest.clearAllMocks(); // Clear all mock data
});

// OR

afterEach(() => {
  jest.restoreAllMocks(); // Restore original implementations
});
```

## ✅ Assertion Examples

### Assert Status Codes

```javascript
expect(mockRes.status).toHaveBeenCalledWith(201); // Created
expect(mockRes.status).toHaveBeenCalledWith(400); // Bad Request
expect(mockRes.status).toHaveBeenCalledWith(404); // Not Found
expect(mockRes.status).toHaveBeenCalledWith(500); // Server Error
```

### Assert Response Data

```javascript
expect(mockRes.json).toHaveBeenCalledWith({
  message: "Success",
  log: expect.any(Object)
});

expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    safetyRating: "Safe"
  })
);
```

### Assert Function Calls

```javascript
expect(waterLogService.createLog).toHaveBeenCalled();
expect(waterLogService.createLog).toHaveBeenCalledTimes(1);
expect(waterLogService.createLog).toHaveBeenCalledWith(
  expect.objectContaining({ phLevel: 7 })
);
```

### Assert Array/Object Properties

```javascript
expect(result).toHaveLength(2);
expect(result).toContain("Safe");
expect(result).toEqual([1, 2, 3]);
expect(result).toHaveProperty("safetyRating", "Safe");
```

### Assert Errors

```javascript
expect(() => fn()).toThrow();
expect(() => fn()).toThrow("Error message");
await expect(asyncFn()).rejects.toThrow();
```

## 🔄 Testing Async Code

### Testing Promises

```javascript
test("should resolve successfully", async () => {
  const result = await waterLogService.createLog(logData);
  expect(result._id).toBeDefined();
});

test("should reject with error", async () => {
  await expect(
    waterLogService.getLogById("invalid")
  ).rejects.toThrow("Water log not found");
});
```

### Testing with Callbacks (Legacy)

```javascript
test("should complete with callback", (done) => {
  waterLogService.createLog(logData, (err, result) => {
    expect(err).toBeNull();
    expect(result._id).toBeDefined();
    done(); // Signals test is complete
  });
});
```

## 📈 Code Coverage

### What Should Be Tested?

```
Coverage Targets:
├── Statements: >85%        (Actual code lines executed)
├── Branches: >80%          (if/else, ternary, switches)
├── Functions: >85%         (All methods called at least once)
└── Lines: >85%             (Actual lines of code)
```

### Coverage Commands

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html

# Show coverage only for WaterLogs
npm test -- --coverage --testPathPattern="waterLog"
```

## 🚀 Adding a New Test

### Step 1: Identify What to Test
- What function/endpoint?
- What's the normal behavior?
- What are edge cases?
- What errors can occur?

### Step 2: Write the Test

```javascript
describe("New Feature", () => {
  test("should behave as expected", () => {
    // Arrange
    const input = "value";
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

### Step 3: Run the Test

```bash
npm test -- --testNamePattern="New Feature"
```

### Step 4: Verify Coverage

```bash
npm test -- --coverage
# Check that your new code has >85% coverage
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Testing Library](https://testing-library.com/)
- [Mock Examples](https://jestjs.io/docs/mock-functions)

---

**Remember**: Good tests document your code and catch bugs early! ✅
