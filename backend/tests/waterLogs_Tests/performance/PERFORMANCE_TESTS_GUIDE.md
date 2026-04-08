# WaterPulse Performance Testing Guide

## Overview

Performance testing ensures the WaterPulse API can handle real-world loads and responds within acceptable time limits. This guide covers three types of performance tests:

1. **Load Testing** - How many concurrent users can the system handle?
2. **Benchmarking** - How fast are individual endpoints?
3. **Memory Profiling** - How efficiently does the system use memory?

---

## Prerequisites

### Installation

Install performance testing dependencies:

```bash
npm install
```

This installs:
- **artillery** - Load and stress testing tool
- **autocannon** - HTTP benchmarking library
- **clinic.js** - Performance profiling toolkit

### Start Backend Server

Before running any performance tests, start the backend server:

```bash
npm start
```

Server will be available at `http://localhost:5000`

### Environment Setup

Ensure `.env` file contains:
```
MONGODB_URI=mongodb://localhost:27017/water-pulse-test
NODE_ENV=test
JWT_SECRET=test-secret-key
```

---

## Performance Test Commands

### 1. HTTP Endpoint Benchmarks

**What it tests:** Response times and throughput of key endpoints

**Command:**
```bash
npm run perf:waterlog:benchmark
```

**What it measures:**
- Average latency (ms)
- P50, P90, P99 percentiles
- Requests per second
- Error rates
- Data throughput (MB/s)

**Example Output:**
```
✅ Benchmark Results for: GET /api/logs - Fetch All Logs

📈 Throughput:
  • Requests/sec: 125.43
  • Average: 125.43 req/s
  • P99: 150 req/s

⏱️  Latency (ms):
  • Average: 45.23 ms
  • P50 (median): 42 ms
  • P90: 58 ms
  • P99: 75 ms
```

**Performance Targets:**
| Endpoint | Acceptable | Good | Excellent |
|----------|-----------|------|-----------|
| GET /api/logs | <200ms | <100ms | <50ms |
| GET /api/logs/:id | <150ms | <75ms | <30ms |
| POST /api/logs | <500ms | <300ms | <150ms |
| PATCH /api/logs/:id | <400ms | <200ms | <100ms |

---

### 2. Memory & Operation Profiling

**What it tests:** Memory usage, operation performance, event loop health

**Command:**
```bash
npm run perf:waterlog:memory
```

**What it measures:**
- Heap memory usage over time
- External memory allocation
- RSS (Resident Set Size)
- Operation execution time
- Memory per operation
- Event loop lag

**Example Output:**
```
📊 MEMORY USAGE TIMELINE

Check Point          Heap Used    Delta        Heap Total   RSS
─────────────────────────────────────────────────────────────────────
Initial State        15.45 MB     0 Bytes      35.20 MB     52.15 MB
After Safety Tests   16.23 MB     780 KB       35.20 MB     52.93 MB
After DB Tests       18.91 MB     2.46 MB      40.15 MB     58.22 MB

⚡ OPERATION PERFORMANCE

Operation                    Total (ms)  Avg Per Op (ms)  Ops/Sec  Mem Delta
─────────────────────────────────────────────────────────────────────────────
calculateSafetyRating        0.45        0.000  ms        >1M      0 Bytes
simulateDbQuery              523.12      5.231  ms        191      0 Bytes
simulateReportLookup         1062.45     10.624 ms        94       0 Bytes
```

**Performance Grades:**
- **A+** - Excellent: < 1ms per operation
- **A** - Good: 1-5ms per operation
- **B** - Acceptable: 5-10ms per operation
- **C+** - Poor: 10-50ms per operation
- **C** - Critical: > 50ms per operation

---

### 3. Load Testing

**What it tests:** System behavior under sustained and peak loads

**Command:**
```bash
npm run perf:waterlog:load
```

**Test Phases:**
1. **Warm-up** (30s) - 5 requests/sec
2. **Ramp-up** (60s) - 10 requests/sec
3. **Sustained** (60s) - 20 requests/sec
4. **Cool-down** (30s) - 5 requests/sec

**Total Duration:** ~3 minutes testing ~3,750 requests

**Configuration File:** `loadTest.artillery.yml`

**Example Output:**
```
Summary report @ 02:30:45 UTC
  scenarios launched:  3750
  scenarios completed: 3745
  requests completed:  11235
  mean latency:        156 ms
  p50 latency:         142 ms
  p99 latency:         318 ms
  
Concurrency:
  mean:  18.5
  p99:   20
  
Errors: 5 (0.13%)
Throughput: 1858 req/sec
```

**Run All Performance Tests:**
```bash
npm run perf:waterlog:all
```

---

## Interpreting Results

### Latency Guidelines

```
EXCELLENT (Gold Tier)      < 50ms    - Real-time feel, no perceptible delay
GOOD (Silver Tier)         < 100ms   - Responsive, users don't notice delay
ACCEPTABLE (Bronze Tier)   < 200ms   - Slightly noticeable but acceptable
SLOW                       < 500ms   - Users notice, affects experience
VERY SLOW                  > 500ms   - Unacceptable, impacts usability
```

### Throughput Guidelines

```
EXCELLENT   > 500 req/sec    - Can handle enterprise-scale traffic
GOOD        200-500 req/sec  - Can handle production load
ACCEPTABLE  50-200 req/sec   - Suitable for moderate usage
POOR        10-50 req/sec    - Bottleneck exists, scaling needed
CRITICAL    < 10 req/sec     - Immediate optimization required
```

### Memory Guidelines

```
HEALTHY              < 50MB growth per 1000 ops  - No memory leak
ACCEPTABLE           50-100MB growth             - Monitor closely
WARNING              100-250MB growth            - Investigate for leaks
CRITICAL             > 250MB growth              - Immediate action needed
```

---

## Performance Optimization Checklist

### 🔍 Database Layer

- [ ] Add indexes on frequently filtered fields (region, safetyRating, createdAt)
- [ ] Use query projection to select only needed fields
- [ ] Implement pagination for large result sets
- [ ] Enable query profiling to find slow queries
- [ ] Consider database read replicas for scaling

```javascript
// Example: Add indexes in MongoDB
db.waterLogs.createIndex({ region: 1, createdAt: -1 })
db.waterLogs.createIndex({ safetyRating: 1 })
db.waterLogs.createIndex({ reportId: 1 })
```

### ⚡ API Layer

- [ ] Implement caching for read-heavy endpoints
- [ ] Use compression (gzip) for responses
- [ ] Implement HTTP caching headers (ETag, Last-Modified)
- [ ] Add rate limiting by IP and user
- [ ] Use connection pooling for databases

```javascript
// Example: Add caching middleware
app.use(compression());
app.get('/api/logs', cacheResponse(300), getLogs); // 5-min cache
```

### 💾 Memory Management

- [ ] Monitor heap usage with `--inspect` flag
- [ ] Use streaming for large datasets
- [ ] Implement garbage collection tuning
- [ ] Profile with clinic.js regularly
- [ ] Set memory limits for Node.js

```bash
# Run with memory monitoring
node --inspect server.js

# Set max heap size
node --max-old-space-size=512 server.js
```

### 🔧 Infrastructure

- [ ] Use load balancer (nginx, HAProxy)
- [ ] Implement horizontal scaling with containers (Docker)
- [ ] Use CDN for static assets
- [ ] Monitor with APM tools (New Relic, DataDog)
- [ ] Set up alerts for performance degradation

---

## Troubleshooting Performance Issues

### High Latency (> 200ms)

**Diagnosis:**
1. Check database query performance
2. Profile with `npm run perf:waterlog:memory`
3. Review slow query logs
4. Check network latency

**Solutions:**
- Add database indexes
- Optimize queries (fewer fields, pagination)
- Enable caching
- Increase database connection pool

### High Memory Usage

**Diagnosis:**
1. Run `npm run perf:waterlog:memory` to identify memory leaks
2. Use `--inspect` to profile heap
3. Check for unbounded array growth

**Solutions:**
- Implement pagination
- Use streaming instead of loading all data
- Clear caches periodically
- Check for circular references in objects

### High Error Rate

**Diagnosis:**
1. Check load test output for error messages
2. Review application logs
3. Verify database connectivity
4. Check API rate limiting

**Solutions:**
- Increase database connection pool
- Implement retry logic with backoff
- Add rate limiting
- Scale horizontally

### Event Loop Lag

**Diagnosis:**
- Run `npm run perf:waterlog:memory` to see lag statistics
- If avg lag > 100ms, there's blocking code

**Solutions:**
- Use worker threads for CPU-intensive tasks
- Break long operations into async chunks
- Use `setImmediate()` for yielding
- Profile with clinic.js

---

## Continuous Performance Testing

### Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
name: Performance Tests
on: [push, pull_request]
jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm start &
      - run: npm run perf:waterlog:memory
      - run: npm run perf:waterlog:benchmark
```

### Baseline Comparisons

Track performance over time:

```bash
# Record baseline
npm run perf:waterlog:benchmark > benchmark-baseline.txt

# After optimization
npm run perf:waterlog:benchmark > benchmark-after.txt

# Compare results
diff benchmark-baseline.txt benchmark-after.txt
```

---

## Advanced: Custom Performance Tests

### Using Clinic.js for Detailed Profiling

```bash
# CPU profiling
clinic doctor -- npm start

# Flame graphs
clinic flame -- npm start

# Memory profiling
clinic bubbleprof -- npm start
```

### Load Testing with Custom Scenarios

Edit `loadTest.artillery.yml` to create custom scenarios:

```yaml
scenarios:
  - name: "High Volume Create + Read"
    weight: 5
    flow:
      - post:
          url: "/api/logs"
          json:
            phLevel: 7.2
            turbidity: 3.0
      - think: 1
      - get:
          url: "/api/logs?safetyRating=Safe"
```

---

## Performance SLA Recommendations

For production deployment:

| Metric | Target | SLA |
|--------|--------|-----|
| P95 Latency | < 100ms | 99% |
| P99 Latency | < 200ms | 99.9% |
| Availability | > 99.9% | 99.95% |
| Error Rate | < 0.1% | < 0.05% |
| Throughput | > 100 req/sec | > 200 req/sec |

---

## Waterlog-Specific Commands

- **Artillery Docs**: https://artillery.io/docs
- **Autocannon**: https://github.com/mcollina/autocannon
- **Clinic.js**: https://clinicjs.org/
- **Node.js Perf Hooks**: https://nodejs.org/api/perf_hooks.html
- **MongoDB Indexing**: https://docs.mongodb.com/manual/indexes/

---

## Next Steps

1. ✅ Run baseline benchmarks (`npm run perf:waterlog:benchmark`)
2. ✅ Profile memory usage (`npm run perf:waterlog:memory`)
3. ✅ Execute load tests (`npm run perf:waterlog:load`)
4. 📊 Compare results against targets
5. 🔧 Implement optimizations
6. 📈 Re-test to validate improvements
7. 📋 Document baseline for future comparisons
