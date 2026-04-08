# Safe Zone Performance Tests

Load and stress testing for WaterPulse Safe Zone system. Tests measure response times, handle large datasets, and validate concurrent request handling.

## 📋 Performance Test Structure

```
safeZone_Tests/performance/
└── safeZoneLoadTest.js          # Load, stress, and performance tests
```

## 🏃 Test Categories

### 1. Create Operation Performance
- ✅ Single zone creation: < 100ms
- ✅ Batch create 50 zones: < 5 seconds
- ✅ Geocoding API call: < 1 second

### 2. Read Operation Performance
- ✅ Fetch 1000 zones: < 200ms
- ✅ Geospatial query: < 200ms
- ✅ Get by ID: < 50ms
- ✅ Fetch 500 user zones: < 200ms

### 3. Update Operation Performance
- ✅ Single zone update: < 100ms
- ✅ Update with re-geocoding: < 1 second
- ✅ Concurrent update 30 zones: < 3 seconds

### 4. Delete Operation Performance
- ✅ Single zone delete: < 50ms
- ✅ Concurrent delete 50 zones: < 2.5 seconds

### 5. Weather API Performance
- ✅ Fetch weather: < 1 second
- ✅ Handle slow API (2s timeout): Complete gracefully
- ✅ Concurrent weather 20 zones: < 5 seconds

### 6. Concurrent Request Handling
- ✅ 100 concurrent reads: < 2 seconds
- ✅ Mixed CRUD (150 ops): < 10 seconds

### 7. Memory & Resource Efficiency
- ✅ No memory leaks on 100 ops
- ✅ Handle 5000-zone dataset efficiently

### 8. Response Time Percentiles
- ✅ p50 (median): < 50ms
- ✅ p95: < 100ms
- ✅ p99: < 150ms

---

## 🚀 Running Performance Tests

### Run All Performance Tests
```bash
npm test -- tests/safeZone_Tests/performance
```

### Run Specific Performance Test
```bash
npm test -- tests/safeZone_Tests/performance -- --testNamePattern="Create Operation"
```

### Run with Detailed Output
```bash
npm test -- tests/safeZone_Tests/performance --verbose
```

### Run Full Test Suite (All Unit + Integration + Performance)
```bash
npm test -- tests/safeZone_Tests
```

---

## 📊 Performance Thresholds

The test suite uses these baseline thresholds:

| Operation Type | Threshold | Notes |
|----------------|-----------|-------|
| Single Operation | < 100ms | Basic CRUD on one zone |
| Batch Operation | < 500ms | 10-50 zones |
| API Call | < 1000ms | Weather/Geocoding APIs |
| Database Query | < 200ms | Read from 1000+ zones |
| Single Delete | < 50ms | Index-based deletion |

---

## 🧪 Test Breakdown

### Create Performance Tests

```javascript
✅ Single zone creation: < 100ms
// Tests basic create operation speed

✅ Batch create 50 zones: < 5 seconds
// Tests consecutive creates (0.1s per zone)

✅ Geocoding API: < 1 second
// Tests reverse-geocoding API performance
```

### Read Performance Tests

```javascript
✅ Fetch 1000 zones: < 200ms
// Tests getAllSafeZones with large dataset

✅ Geospatial query: < 200ms
// Tests MongoDB $near operator performance with 100 zones

✅ Get by ID: < 50ms
// Tests fast ID-based lookup

✅ Fetch 500 user zones: < 200ms
// Tests filtering by user with large dataset
```

### Concurrent Load Tests

```javascript
✅ 100 concurrent reads
// Simulates 100 simultaneous zone fetch requests

✅ Mixed CRUD (150 operations)
// 50 creates + 50 reads + 50 updates
// Tests system under mixed workload

✅ 20 concurrent weather requests
// Simulates real-world scenario of multiple users checking weather
```

### Weather API Tests

```javascript
✅ Fetch weather: < 1 second
// Tests OpenWeatherMap API integration

✅ Handle slow API gracefully
// Tests what happens when API is slow (2+ seconds)

✅ 20 concurrent weather requests: < 5 seconds
// Realistic load - multiple users checking weather simultaneously
```

---

## 📈 Sample Test Results

```
PASS  tests/safeZone_Tests/performance/safeZoneLoadTest.js

Create Operation Performance
  ✓ should create a single zone in under 100ms (2 ms)
  ✓ should create 50 zones in under 5 seconds (234 ms)
  ✓ should handle geocoding API call within 1 second (512 ms)

Read Operation Performance
  ✓ should fetch all zones from 1000-zone dataset in under 200ms (45 ms)
  ✓ should fetch nearby zones with geospatial query in under 200ms (38 ms)
  ✓ should fetch zone by ID in under 50ms (8 ms)

Concurrent Request Handling
  ✓ should handle 100 concurrent read requests in under 2 seconds (187 ms)
  ✓ should handle mixed CRUD operations (150 total) in under 10 seconds (1234 ms)

Memory & Resource Efficiency
  ✓ should not leak memory on repeated operations
  ✓ should handle large dataset (5000 zones) efficiently (52 ms)

Response Time Percentiles
  ✓ Response time distribution - p50: 12ms, p95: 28ms, p99: 42ms

Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Time:        3.456 s
```

---

## 🎯 Performance Monitoring

### Track Improvements Over Time

Run performance tests regularly to monitor:

```bash
# Weekly performance check
npm test -- tests/safeZone_Tests/performance > performance_report.txt
```

Compare reports to detect:
- 🔴 Performance regressions (slower responses)
- 🟢 Performance improvements (optimizations)
- ⚠️ Memory leaks (increasing heap usage)

### Key Metrics to Monitor

1. **Response Times**
   - p50 (50th percentile): Typical user experience
   - p95 (95th percentile): Most users
   - p99 (99th percentile): Worst-case scenario

2. **Throughput**
   - Operations per second
   - Concurrent request capacity

3. **Resource Usage**
   - Heap memory consumption
   - Database query time

---

## 🔧 Adjusting Thresholds

When optimizing, adjust thresholds in the test file:

```javascript
const PERFORMANCE_THRESHOLDS = {
  SINGLE_OPERATION: 100,    // Adjust based on requirements
  BATCH_OPERATION: 500,
  API_CALL: 1000,
  DATABASE_QUERY: 200,
};
```

### When to Adjust Thresholds

✅ After code optimization (lower thresholds)
⚠️ Before scaling (higher thresholds for stress testing)
🔴 For slow environment (higher thresholds temporarily)

---

## 📊 Performance Optimization Tips

### For Database Queries
- ✅ Ensure indexes exist (especially for geospatial `2dsphere`)
- ✅ Limit returned fields when possible
- ✅ Use pagination for large datasets

### For API Calls
- ✅ Implement caching (weather doesn't change every second)
- ✅ Set reasonable timeouts (1-2 seconds)
- ✅ Retry failed requests with exponential backoff

### For Concurrent Operations
- ✅ Use connection pooling (database)
- ✅ Limit concurrent API calls (rate limiting)
- ✅ Implement queue system for heavy operations

### For Memory
- ✅ Stream large datasets instead of loading all
- ✅ Clean up mock data in tests
- ✅ Use pagination/cursors for large result sets

---

## 🚨 When Performance Tests Fail

**Slow Response Time:**
1. Check database index status
2. Profile query with database tools
3. Look for N+1 query problems
4. Consider caching

**Memory Leak:**
1. Check if mocks are cleared in `afterEach`
2. Look for circular references
3. Profile heap snapshots
4. Check for event listener leaks

**Timeout:**
1. Increase threshold temporarily to identify slow component
2. Add performance logging
3. Check external API status
4. Look for deadlocks

---

## 📚 Related Documentation

- [TEST_PATTERNS.md](../TEST_PATTERNS.md) - General testing patterns
- [unit/README.md](../unit/) - Unit testing guide
- [integration/README.md](../integration/) - Integration testing guide

---

## ✅ Command Reference

```bash
# Run all performance tests
npm test -- tests/safeZone_Tests/performance

# Run with verbose output
npm test -- tests/safeZone_Tests/performance --verbose

# Run specific test
npm test -- tests/safeZone_Tests/performance --testNamePattern="concurrent"

# Run with coverage (if configured)
npm test -- --coverage tests/safeZone_Tests/performance

# Watch mode for development
npm test -- --watch tests/safeZone_Tests/performance
```

---

## 💡 Performance Testing Best Practices

✅ **Always measure** - Don't guess, use actual metrics
✅ **Test against production-like data** - Use realistic dataset sizes
✅ **Consistent environment** - Run tests on similar hardware
✅ **Baseline before optimizing** - Know current performance first
✅ **Test concurrent scenarios** - Real users access simultaneously
✅ **Monitor over time** - Track trends, not just snapshots
✅ **Document thresholds** - Explain why limits are set

---

## 🔗 Performance Optimization Roadmap

### Phase 1: Baseline (Current)
- ✅ Establish baseline performance metrics
- ✅ Identify bottlenecks
- ✅ Set initial thresholds

### Phase 2: Quick Wins
- 🔄 Add database indexes
- 🔄 Implement simple caching
- 🔄 Optimize query selectors

### Phase 3: Advanced Optimizations
- 🔄 Implement pagination
- 🔄 Add request batching
- 🔄 Use CDN for static assets

### Phase 4: Scaling
- 🔄 Database replication
- 🔄 API rate limiting
- 🔄 Load balancing

---

## ❓ Questions?

Refer to [TEST_PATTERNS.md](../TEST_PATTERNS.md) for general testing patterns used across WaterPulse.
