# Safe Zone Tests

Comprehensive test suite for WaterPulse Safe Zone management system. Tests cover CRUD operations, geolocation features, weather integration, and role-based access control.

## 📋 Test Organization

```
safeZone_Tests/
├── unit/
│   └── safeZoneEndpoints.test.js      # Unit tests for controller methods
├── integration/
│   └── safeZoneIntegration.test.js    # Integration tests for API flows
└── README.md                           # This file
```

## 🧪 Test Coverage

### Unit Tests (`safeZoneEndpoints.test.js`)

**Individual endpoint testing with mocked models**

#### Create Safe Zone Tests
- ✅ Successfully create zone with all required fields
- ✅ Validate missing name
- ✅ Validate missing type
- ✅ Validate invalid coordinates
- ✅ Handle reverse geocoding failures gracefully

#### Read Safe Zones Tests
- ✅ Fetch all zones with populated creator info
- ✅ Return empty array when no zones exist
- ✅ Handle database errors during fetch
- ✅ Get nearby zones within specified distance
- ✅ Validate latitude/longitude query parameters
- ✅ Use default maxDistance and limit when not provided
- ✅ Get zone by ID with proper population
- ✅ Return 404 for non-existent zones
- ✅ Get user's created zones only

#### Update Safe Zone Tests
- ✅ Update zone details as admin
- ✅ Update coordinates and re-geocode location
- ✅ Prevent authority from editing others' zones
- ✅ Allow authority to edit own zones
- ✅ Validate coordinate format during update
- ✅ Handle not found errors

#### Weather Tests
- ✅ Return weather with low contamination risk (clear conditions)
- ✅ Detect medium risk with rain
- ✅ Detect high risk with thunderstorm and high humidity
- ✅ Return 404 for non-existent zones
- ✅ Return 503 when API key not configured

#### Delete Safe Zone Tests
- ✅ Delete zone as admin
- ✅ Allow authority to delete own zones
- ✅ Prevent authority from deleting others' zones
- ✅ Return 404 when zone not found

---

### Integration Tests (`safeZoneIntegration.test.js`)

**End-to-end API flow testing**

#### Zone Creation Flow
- ✅ Create zone and return 201 with full data
- ✅ Validate required fields during creation
- ✅ Validate coordinate format

#### Zone Retrieval Flow
- ✅ Fetch all zones for admin dashboard
- ✅ Fetch zones near user location (geolocation)
- ✅ Fetch user's created zones
- ✅ Fetch specific zone by ID

#### Zone Update Flow
- ✅ Update zone details successfully
- ✅ Update location and re-geocode
- ✅ Prevent unauthorized updates (authority on others' zones)
- ✅ Allow authorized updates (authority on own zones)

#### Weather Check Flow
- ✅ Clear conditions = low risk
- ✅ Rain = medium risk
- ✅ Thunderstorm + high humidity = high risk
- ✅ Handle missing/invalid API key

#### Zone Deletion Flow
- ✅ Delete as admin
- ✅ Prevent unauthorized deletion
- ✅ Allow authorized deletion
- ✅ Handle not found errors

#### Error Handling
- ✅ Handle database connection errors
- ✅ Handle weather API errors
- ✅ Handle geocoding failures gracefully

---

## 🚀 Running the Tests

### Run All Safe Zone Tests
```bash
npm test -- tests/safeZone_Tests
```

### Run Unit Tests Only
```bash
npm test -- tests/safeZone_Tests/unit
```

### Run Integration Tests Only
```bash
npm test -- tests/safeZone_Tests/integration
```

### Run Tests with Coverage
```bash
npm test -- --coverage tests/safeZone_Tests
```

### Run Tests in Watch Mode
```bash
npm test -- --watch tests/safeZone_Tests
```

---

## 🏗️ Test Architecture

### Unit Tests Pattern

```javascript
// Mock models and services
jest.mock("../../../models/safeZone.js");
jest.mock("axios");

describe("Safe Zone Endpoints - Unit Tests", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock request/response objects
  });

  describe("createSafeZone", () => {
    test("should create zone successfully", async () => {
      // Arrange: Setup test data
      // Act: Call the function
      // Assert: Verify results
    });
  });
});
```

### Integration Tests Pattern

```javascript
describe("Safe Zone Creation Flow", () => {
  test("should create zone and return proper response", async () => {
    // Full flow: from controller through mocked models
    // Verify complete response structure
    // Check status codes and data formatting
  });
});
```

---

## 📊 Test Scenarios

### Role-Based Access Control Testing

**Admin User**
- ✅ Can create zones
- ✅ Can edit ANY zone
- ✅ Can delete ANY zone
- ✅ Can view all zones

**Authority User**
- ✅ Can create zones
- ✅ Can edit ONLY own zones
- ✅ Can delete ONLY own zones
- ✅ Can view all zones (read-only)
- ❌ Cannot edit others' zones
- ❌ Cannot delete others' zones

---

## 🌦️ Weather Risk Assessment Testing

### Risk Level Determination

```javascript
// Low Risk: Clear skies, low humidity
weather: "Clear", humidity: 60% → Risk: Low

// Medium Risk: Rain detected
weather: "Rain", humidity: 80% → Risk: Medium

// High Risk: Thunderstorm + excessive humidity
weather: "Thunderstorm", humidity: 90% → Risk: High
```

### Tested Conditions
- Clear, Cloudy → Low Risk
- Rain, Drizzle → Medium+ Risk
- Thunderstorm, Snow → High Risk
- High Humidity (>90%) → Increases risk level

---

## 🗺️ Geolocation Testing

### MongoDB Geospatial Query Testing

```javascript
// Tested: $near geospatial operator
const safeZones = await SafeZone.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: 5000 // meters
    }
  }
});

// Test cases:
- Query with valid coordinates ✅
- Query with invalid coordinates ✅
- Default distance limits ✅
- Custom distance limits ✅
```

---

## 🔐 Security Testing

### Ownership Validation

```javascript
// Authority trying to edit/delete another's zone
✅ Tested: Returns 403 Forbidden
✅ Tested: Zone not modified
✅ Tested: Authorization check performed

// Authority editing own zone
✅ Tested: Allows modification
✅ Tested: Proper update applied
```

### Input Validation

```javascript
// Coordinate validation
✅ NaN detection
✅ Type conversion validation
✅ Range validation (optional)

// Required field validation
✅ name required
✅ type required
✅ latitude/longitude required
```

---

## 🛠️ Mock Structure

### Mocked Models

```javascript
// SafeZone model
jest.mock("../../../models/safeZone.js");
SafeZone.find()
SafeZone.findById()
SafeZone.findByIdAndUpdate()
SafeZone.findByIdAndDelete()
SafeZone.prototype.save()

// Axios for external API calls
jest.mock("axios");
axios.get() // For weather and geocoding APIs
```

---

## 📝 Test Maintenance

### When Adding New Features

1. Add unit tests in `unit/safeZoneEndpoints.test.js`
2. Add integration tests in `integration/safeZoneIntegration.test.js`
3. Follow AAA pattern: Arrange, Act, Assert
4. Mock all external dependencies
5. Test both success and failure paths

### Common Patterns

**Testing Geocoding:**
```javascript
axios.get.mockResolvedValue({ data: { display_name: "Location" } });
axios.get.mockRejectedValue(new Error("Timeout"));
```

**Testing Database Operations:**
```javascript
SafeZone.find = jest.fn().mockReturnValue({
  populate: jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue(mockData)
  })
});
```

---

## 🐛 Known Test Limitations

1. **External API Integration**: Weather API calls are mocked, not tested against live API
2. **Database Transactions**: Tests don't verify actual MongoDB geospatial indexing
3. **Real Geocoding**: Reverse geocoding uses mock responses
4. **File Upload**: Not applicable to Safe Zones
5. **Real-time Updates**: WebSocket testing not included

---

## 📈 Coverage Goals

Target test coverage for Safe Zone module:

- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 95%+
- **Lines**: 95%+

Run coverage report:
```bash
npm test -- --coverage tests/safeZone_Tests
```

---

## 🔗 Related Test Suites

- [Task Tests](../task_Tests/) - Task assignment and management
- [Water Logs Tests](../waterLogs_Tests/) - Water quality measurements
- [Contamination Report Tests](../contaminationReport_Tests/) - Report handling

---

## ✅ Checklist for New Safe Zone Features

- [ ] Unit tests created in `unit/safeZoneEndpoints.test.js`
- [ ] Integration tests created in `integration/safeZoneIntegration.test.js`
- [ ] All success paths tested
- [ ] All error paths tested
- [ ] Role-based access tested
- [ ] Input validation tested
- [ ] External API calls mocked
- [ ] Database operations mocked
- [ ] Test passes locally: `npm test -- safeZone_Tests`
- [ ] Coverage meets targets: `npm test -- --coverage safeZone_Tests`

---

## 📞 Questions?

Refer to [TEST_PATTERNS.md](../TEST_PATTERNS.md) for general testing patterns used across WaterPulse.
