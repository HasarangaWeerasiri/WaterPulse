# Task Management Performance Tests

Quick reference for running task management performance tests.

## Files

| File | Purpose |
|------|---------|
| `benchmarks.js` | HTTP throughput benchmarks via autocannon |
| `loadTest.artillery.yml` | Artillery multi-phase load test |
| `loadTestProcessor.js` | Artillery variable generators & hooks |
| `memoryProfile.js` | Memory and CPU profiling |
| `PERFORMANCE_TESTS_GUIDE.md` | Full documentation |

## Quick Start

```bash
# Start the backend server first
npm start

# Run HTTP benchmarks
npm run perf:task:benchmark

# Run load tests
npx artillery run tests/task_Tests/performance/loadTest.artillery.yml

# Run memory profiling
npm run perf:task:memory
```

## Endpoints Tested

- `GET /api/tasks` — all tasks
- `GET /api/tasks?status=pending` — filter by status
- `GET /api/tasks?priority=high` — filter by priority
- `POST /api/tasks` — create task
- `PUT /api/tasks/:id/status` — update task status
- `DELETE /api/tasks/:id` — delete task
- `GET /api/tasks/authorities` — list authority users

For detailed instructions, see [PERFORMANCE_TESTS_GUIDE.md](./PERFORMANCE_TESTS_GUIDE.md).
