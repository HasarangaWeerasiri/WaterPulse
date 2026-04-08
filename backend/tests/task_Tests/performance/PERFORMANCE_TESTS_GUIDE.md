# Task Management Performance Tests Guide

This guide covers how to run, interpret, and extend performance tests for the WaterPulse Task Management feature.

## 📁 Performance Test Files

```
performance/
├── benchmarks.js              # HTTP throughput benchmarks (autocannon)
├── loadTest.artillery.yml     # Artillery load test configuration
├── loadTestProcessor.js       # Artillery hooks and variable generators
├── memoryProfile.js           # Memory & CPU profiling script
├── PERFORMANCE_TESTS_GUIDE.md # This file
└── README.md                  # Quick overview
```

## ⚡ Prerequisites

1. **Backend server running**:
   ```bash
   cd backend
   npm start
   ```

2. **MongoDB connected** with test data seeded

3. **Performance tools installed**:
   ```bash
   npm install --save-dev autocannon artillery
   ```

## 🏃 Running Performance Tests

### HTTP Benchmarks (autocannon)
```bash
npm run perf:task:benchmark
```

Measures throughput and latency for:
- `GET /api/tasks` — fetch all tasks
- `GET /api/tasks?status=pending` — filter by status
- `GET /api/tasks?priority=high` — filter by priority
- `POST /api/tasks` — create task
- `GET /api/tasks/authorities` — list authorities

---

### Load Tests (Artillery)
```bash
# Run full load test
npx artillery run tests/task_Tests/performance/loadTest.artillery.yml

# Run with a report
npx artillery run tests/task_Tests/performance/loadTest.artillery.yml --output results.json
npx artillery report results.json
```

**Load Phases:**
| Phase          | Duration | Arrival Rate |
|----------------|----------|--------------|
| Warm up        | 30s      | 5 users/s    |
| Ramp up        | 60s      | 10 users/s   |
| Sustained load | 60s      | 20 users/s   |
| Cool down      | 30s      | 5 users/s    |

---

### Memory & CPU Profiling
```bash
npm run perf:task:memory
```

Measures:
- Heap used / heap total
- RSS (Resident Set Size)
- Operation throughput (ops/sec)
- Event loop lag

## 📊 Interpreting Results

### Latency Targets

| Endpoint              | Acceptable | Good    | Excellent |
|-----------------------|------------|---------|-----------|
| GET /api/tasks        | < 100ms    | < 50ms  | < 20ms    |
| GET /api/tasks/:id    | < 100ms    | < 50ms  | < 20ms    |
| POST /api/tasks       | < 300ms    | < 150ms | < 80ms    |
| PUT /api/tasks/:id/status | < 200ms | < 100ms | < 50ms |
| GET /api/tasks/authorities | < 100ms | < 50ms | < 20ms |

### Performance Grade Scale

| Grade | Avg Op Time | Description       |
|-------|-------------|-------------------|
| A+    | < 1ms       | Excellent          |
| A     | 1–5ms       | Good               |
| B     | 5–10ms      | Acceptable         |
| C+    | 10–50ms     | Needs optimization |
| C     | > 50ms      | Critical           |

## ⚠️ Common Issues

### High Latency on POST /api/tasks
- Multiple sequential DB queries (report exists, active task check, user role checks)
- **Fix**: Add compound indexes on `(reportId, status)` and `(assignedTo, status)`

### Memory Growth Under Load
- Large populated task documents returned in arrays
- **Fix**: Implement pagination, project only required fields

### Event Loop Lag
- Synchronous user role validation during task creation
- **Fix**: Cache authority user list in Redis or memory

## 🛠️ Extending the Tests

### Add a New Benchmark Scenario

In `benchmarks.js`:
```javascript
const getMyTasks = await runBenchmark(
  'GET /api/tasks/my-tasks - My Authority Tasks',
  {
    requests: [
      {
        path: '/api/tasks/my-tasks',
        headers: { 'Authorization': AUTHORITY_TOKEN },
      },
    ],
  }
);
displayResults(getMyTasks);
results.push(getMyTasks);
```

### Add a New Artillery Scenario

In `loadTest.artillery.yml`:
```yaml
- name: "My Tasks Authority Load Test"
  weight: 1
  flow:
    - get:
        url: "/api/tasks/my-tasks"
    - think: 1
    - get:
        url: "/api/tasks/my-tasks?status=in_progress"
```

## 📚 References

- [autocannon docs](https://github.com/mcollina/autocannon)
- [Artillery docs](https://www.artillery.io/docs)
- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
