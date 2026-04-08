# Performance Testing Suite

This directory contains comprehensive performance testing tools for the WaterPulse Water Log API.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start Backend Server
```bash
npm start
```

### 3. Run Performance Tests

**Memory & Operation Profiling:**
```bash
npm run perf:waterlog:memory
```

**HTTP Endpoint Benchmarks:**
```bash
npm run perf:waterlog:benchmark
```

**Load Testing (requires running server):**
```bash
npm run perf:waterlog:load
```

**Run All Tests:**
```bash
npm run perf:waterlog:all
```

---

## Test Files

### `benchmarks.js`
HTTP endpoint performance testing using autocannon.

**Measures:**
- Average latency per endpoint
- P50, P90, P99 percentiles
- Throughput (requests/second)
- Error rates
- Data throughput (MB/s)

**Endpoints Tested:**
- GET /api/logs (fetch all)
- GET /api/logs/region/:region (filtered)
- GET /api/logs?safetyRating=... (query filters)
- POST /api/logs (create new)

---

### `memoryProfile.js`
Memory usage and operation performance profiling.

**Measures:**
- Heap memory usage (used, total)
- RSS (Resident Set Size)
- Operation execution time
- Memory per operation
- Event loop lag detection

**Operations Profiled:**
- calculateSafetyRating (1000 iterations)
- Database query simulation (100 iterations)
- Report lookup simulation (100 iterations)
- Large array generation & filtering (100 iterations)

---

### `loadTest.artillery.yml`
Load and stress testing configuration for Artillery.

**Test Phases:**
1. Warm-up: 5 req/sec for 30s
2. Ramp-up: 10 req/sec for 60s
3. Sustained: 20 req/sec for 60s
4. Cool-down: 5 req/sec for 30s

**Total Duration:** ~3 minutes testing ~3,750 requests

---

### `loadTestProcessor.js`
Helper functions for Artillery load tests.

**Functions:**
- `generatePhLevel()` - Random pH 6.0-8.5
- `generateTurbidity()` - Random turbidity 1-8 NTU
- `beforeRequest()` - Setup before each request
- `afterResponse()` - Validate responses

---

## Performance Targets

### Latency (Response Time)
```
GET /api/logs:      < 50ms (excellent), < 100ms (good)
GET /api/logs/:id:  < 30ms (excellent), < 75ms (good)
POST /api/logs:     < 150ms (excellent), < 300ms (good)
PATCH /api/logs:    < 100ms (excellent), < 200ms (good)
```

### Throughput
```
Excellent:  > 500 req/sec
Good:       200-500 req/sec
Acceptable: 50-200 req/sec
Poor:       10-50 req/sec
Critical:   < 10 req/sec
```

### Memory
```
Healthy:    < 50MB per 1000 operations
Acceptable: 50-100MB per 1000 operations
Warning:    100-250MB per 1000 operations
Critical:   > 250MB per 1000 operations
```

---

## Understanding Results

### Memory Report Example
```
📊 MEMORY USAGE TIMELINE
✓ Tracks heap growth, RSS, external memory
✓ Shows delta from initial state
✓ Identifies memory leaks

⚡ OPERATION PERFORMANCE
✓ Total time for all iterations
✓ Average time per operation
✓ Operations per second (throughput)
✓ Memory delta per operation

⏱️  EVENT LOOP LAG
✓ Min, Avg, P95, Max lag in ms
✓ Indicates if blocking operations exist
✓ Healthy: < 10ms avg lag
```

### Latency Report Example
```
📈 Throughput:
✓ Requests per second
✓ P99 = 99th percentile (tail latency)

⏱️  Latency:
✓ P50 = median response time
✓ P90, P99 = worst case responses
✓ Higher percentiles = user experience impact
```

---

## Troubleshooting

### "Cannot find module" error
```bash
npm install
npm install --save-dev artillery autocannon clinic
```

### "ECONNREFUSED" error  
Backend server is not running. Start it:
```bash
npm start
```

### "Benchmark failed" message
- Check server is running on http://localhost:5000
- Verify database is connected
- Check network connectivity

### Memory keeps growing
Possible memory leak detected. Check:
1. Database connection pool size
2. Uncleared caches
3. Unbounded event listeners
4. Circular object references

---

## Advanced Usage

### Profile Individual Operations
```bash
node tests/waterLogs_Tests/performance/memoryProfile.js
```

### Run Custom Benchmark
```bash
node tests/waterLogs_Tests/performance/benchmarks.js
```

### Run Artillery with Options
```bash
artillery run tests/waterLogs_Tests/performance/loadTest.artillery.yml \
  --target http://localhost:5000 \
  --duration 120 \
  --ramp 10
```

---

## Continuous Performance Monitoring

### Baseline Recording
```bash
npm run perf:waterlog:benchmark > baseline-$(date +%Y%m%d).txt
```

### Tracking Over Time
```bash
for i in {1..5}; do
  npm run perf:waterlog:memory
  sleep 60
done
```

---

## Resources

- **Performance Testing Guide**: See `PERFORMANCE_TESTS_GUIDE.md`
- **Artillery Documentation**: https://artillery.io/docs
- **Autocannon**: https://github.com/mcollina/autocannon
- **Node.js Profiling**: https://nodejs.org/en/docs/guides/simple-profiling/
- **Clinic.js**: https://clinicjs.org/

---

## Commands Reference

```bash
# Memory profiling
npm run perf:waterlog:memory

# HTTP benchmarking
npm run perf:waterlog:benchmark

# Load testing
npm run perf:waterlog:load

# Run all tests
npm run perf:waterlog:all

# Run with server
npm start &
npm run perf:waterlog:benchmark
npm run perf:waterlog:memory
```

---

## Performance Optimization Tips

1. **In-take**: Use indexes on frequently filtered fields
2. **Caching**: Cache GET responses with short TTL
3. **Compression**: Enable gzip for responses
4. **Pooling**: Use connection pooling for DB
5. **Streaming**: Use streaming for large datasets
6. **Pagination**: Limit result sets size
7. **Profiling**: Regular clinic.js profiling
8. **Monitoring**: APM tools for production

---

**Last Updated:** April 8, 2026
**WaterPulse Version:** 1.0.0
**Test Framework:** Artillery + Autocannon + Node.js perf_hooks
