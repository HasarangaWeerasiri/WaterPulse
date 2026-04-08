/**
 * Performance Benchmarks for WaterPulse Task Management Endpoints
 * 
 * This file uses autocannon to run HTTP performance benchmarks
 * measuring response times, throughput, and latency for key task endpoints.
 * 
 * Usage: npm run perf:task:benchmark
 */

import autocannon from 'autocannon';

const BASE_URL = 'http://localhost:5000';
const TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MDAwMDAwMDAwMDAwMDAwMDAwMDAwMSIsImlhdCI6MTcxNDAwMDAwMH0.test_token_for_load_testing';

/**
 * Run a single benchmark test
 * @param {string} name - Test name
 * @param {object} options - Autocannon options
 * @returns {Promise<object>} Benchmark results
 */
async function runBenchmark(name, options) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 Running: ${name}`);
  console.log(`${'='.repeat(80)}`);

  const result = await autocannon({
    url: BASE_URL,
    duration: 10,
    connections: 10,
    pipelining: 1,
    ...options,
  });

  return {
    name,
    ...result,
  };
}

/**
 * Format benchmark results for display
 * @param {object} result - Autocannon result
 */
function displayResults(result) {
  if (!result || !result.requests) {
    console.log('❌ Benchmark failed or no results');
    return;
  }

  const { requests, latency, throughput, errors, timeouts } = result;

  console.log(`
✅ Benchmark Results for: ${result.name}

📈 Throughput:
  • Requests/sec: ${requests.mean.toFixed(2)}
  • Average: ${requests.average.toFixed(2)} req/s
  • P99: ${requests.p99} req/s

⏱️  Latency (ms):
  • Average: ${latency.mean.toFixed(2)} ms
  • P50 (median): ${latency.p50} ms
  • P90: ${latency.p90} ms
  • P99: ${latency.p99} ms

📊 Data:
  • Throughput: ${(throughput.mean / 1024 / 1024).toFixed(2)} MB/s
  • Errors: ${errors}
  • Timeouts: ${timeouts}
`);
}

/**
 * Main benchmark suite for Task Management endpoints
 */
async function runBenchmarks() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║         WaterPulse Task Management Performance Benchmarks                  ║
╚════════════════════════════════════════════════════════════════════════════╝

⚠️  PREREQUISITES:
   • Backend server running on http://localhost:5000
   • MongoDB database connected
   • Start server with: npm start

Benchmarking individual task endpoints for 10 seconds each with varying loads...
`);

  const results = [];

  try {
    // Benchmark 1: GET all tasks (read-heavy)
    const getAllTasks = await runBenchmark(
      'GET /api/tasks - Fetch All Tasks',
      {
        requests: [
          {
            path: '/api/tasks',
            headers: { 'Authorization': TOKEN },
          },
        ],
      }
    );
    displayResults(getAllTasks);
    results.push(getAllTasks);

    // Benchmark 2: GET tasks filtered by status
    const getTasksByStatus = await runBenchmark(
      'GET /api/tasks?status=pending - Filter by Status',
      {
        requests: [
          {
            path: '/api/tasks?status=pending',
            headers: { 'Authorization': TOKEN },
          },
        ],
      }
    );
    displayResults(getTasksByStatus);
    results.push(getTasksByStatus);

    // Benchmark 3: GET tasks filtered by priority
    const getTasksByPriority = await runBenchmark(
      'GET /api/tasks?priority=high - Filter by Priority',
      {
        requests: [
          {
            path: '/api/tasks?priority=high',
            headers: { 'Authorization': TOKEN },
          },
        ],
      }
    );
    displayResults(getTasksByPriority);
    results.push(getTasksByPriority);

    // Benchmark 4: POST create task (write-heavy)
    const createTask = await runBenchmark(
      'POST /api/tasks - Create New Task',
      {
        requests: [
          {
            path: '/api/tasks',
            method: 'POST',
            headers: {
              'Authorization': TOKEN,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reportId: '660000000000000000000001',
              assignedTo: '660000000000000000000002',
              priority: 'high',
              title: 'Investigate Water Contamination',
              description: 'Perform a site inspection and log findings',
            }),
          },
        ],
      }
    );
    displayResults(createTask);
    results.push(createTask);

    // Benchmark 5: GET authorities list
    const getAuthorities = await runBenchmark(
      'GET /api/tasks/authorities - Fetch Authorities',
      {
        requests: [
          {
            path: '/api/tasks/authorities',
            headers: { 'Authorization': TOKEN },
          },
        ],
      }
    );
    displayResults(getAuthorities);
    results.push(getAuthorities);

    // Summary Report
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                          BENCHMARK SUMMARY REPORT                          ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

    console.log(`\n📊 Comparison of All Task Endpoints:\n`);
    console.table(results.map(r => ({
      'Endpoint': r.name.split(' - ')[0],
      'Avg Latency (ms)': r.latency?.mean ? r.latency.mean.toFixed(2) : 'N/A',
      'P99 Latency (ms)': r.latency?.p99 || 'N/A',
      'Throughput (req/s)': r.requests?.mean ? r.requests.mean.toFixed(2) : 'N/A',
      'Errors': r.errors || 0,
    })));

    // Performance Recommendations
    const postResult = results[3]; // createTask
    const getResult  = results[0]; // getAllTasks

    console.log(`
📋 PERFORMANCE INSIGHTS:

${postResult.latency?.mean < 100
  ? '✅ POST performance: EXCELLENT (< 100ms)'
  : postResult.latency?.mean < 200
  ? '⚠️  POST performance: ACCEPTABLE (100-200ms)'
  : '❌ POST performance: SLOW (> 200ms)'}

${getResult.latency?.mean < 50
  ? '✅ GET performance: EXCELLENT (< 50ms)'
  : getResult.latency?.mean < 100
  ? '⚠️  GET performance: ACCEPTABLE (50-100ms)'
  : '❌ GET performance: SLOW (> 100ms)'}

${results.some(r => r.errors > 0)
  ? '⚠️  WARNING: Some endpoints reported errors during benchmarks'
  : '✅ All endpoints completed without errors'}

💡 RECOMMENDATIONS:

1. Database Indexing:
   - Ensure indexes on 'status', 'priority', 'assignedTo', and 'createdAt' fields
   - Compound index on (assignedTo, status) for authority task queries

2. Caching Strategy:
   - Consider caching /api/tasks/authorities (data changes infrequently)
   - Cache filtered task lists with short TTL (1-2 minutes)

3. Connection Pooling:
   - Verify MongoDB connection pool size (recommendation: 50-100)
   - Monitor connection reuse metrics

4. Load Distribution:
   - Current benchmark uses 10 connections for 10 seconds
   - Production should test with 50-100 concurrent connections
   - Monitor API for horizontal scaling needs if avg latency > 500ms

5. Query Optimization:
   - Profile database queries in production
   - Consider pagination for large task result sets
   - Use field projection to reduce payload size
`);

  } catch (error) {
    console.error('❌ Benchmark Error:', error.message);
    process.exit(1);
  }
}

// Run benchmarks
runBenchmarks().catch(console.error);
