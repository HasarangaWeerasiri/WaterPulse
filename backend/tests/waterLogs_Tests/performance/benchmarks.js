/**
 * Performance Benchmarks for WaterPulse Water Log Endpoints
 * 
 * This file uses autocannon to run HTTP performance benchmarks
 * measuring response times, throughput, and latency for key endpoints
 * 
 * Usage: npm run perf:benchmark
 */

import autocannon from 'autocannon';
import http from 'http';

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
 * Main benchmark suite
 */
async function runBenchmarks() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              WaterPulse Performance Benchmarks - HTTP Endpoints             ║
╚════════════════════════════════════════════════════════════════════════════╝

⚠️  PREREQUISITES:
   • Backend server running on http://localhost:5000
   • MongoDB database connected
   • Start server with: npm start

Benchmarking individual endpoints for 10 seconds each with varying loads...
`);

  const results = [];

  try {
    // Benchmark 1: GET all logs (read-heavy)
    const getAllLogs = await runBenchmark(
      'GET /api/logs - Fetch All Logs',
      {
        requests: [
          {
            path: '/api/logs',
            headers: { 'Authorization': TOKEN },
          },
        ],
      }
    );
    displayResults(getAllLogs);
    results.push(getAllLogs);

    // Benchmark 2: GET logs by region (filtered read)
    const getLogsByRegion = await runBenchmark(
      'GET /api/logs/region/:region - Filter by Region',
      {
        requests: [
          {
            path: '/api/logs/region/Downtown',
            headers: { 'Authorization': TOKEN },
          },
        ],
      }
    );
    displayResults(getLogsByRegion);
    results.push(getLogsByRegion);

    // Benchmark 3: GET logs with query filters
    const getLogsFiltered = await runBenchmark(
      'GET /api/logs?safetyRating=Safe - Query Filters',
      {
        requests: [
          {
            path: '/api/logs?safetyRating=Safe',
            headers: { 'Authorization': TOKEN },
          },
        ],
      }
    );
    displayResults(getLogsFiltered);
    results.push(getLogsFiltered);

    // Benchmark 4: POST create log (write-heavy)
    const createLog = await runBenchmark(
      'POST /api/logs - Create New Log',
      {
        requests: [
          {
            path: '/api/logs',
            method: 'POST',
            headers: { 
              'Authorization': TOKEN,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phLevel: 7.2,
              turbidity: 3.5,
              region: 'Downtown',
              contaminants: ['Lead'],
              reportId: '660000000000000000000001',
            }),
          },
        ],
      }
    );
    displayResults(createLog);
    results.push(createLog);

    // Summary Report
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                          BENCHMARK SUMMARY REPORT                          ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

    console.log(`\n📊 Comparison of All Endpoints:\n`);
    console.table(results.map(r => ({
      'Endpoint': r.name.split(' - ')[0],
      'Avg Latency (ms)': r.latency?.mean ? r.latency.mean.toFixed(2) : 'N/A',
      'P99 Latency (ms)': r.latency?.p99 || 'N/A',
      'Throughput (req/s)': r.requests?.mean ? r.requests.mean.toFixed(2) : 'N/A',
      'Errors': r.errors || 0,
    })));

    // Performance Recommendations
    console.log(`
📋 PERFORMANCE INSIGHTS:

${results[3].latency?.mean < 100 
  ? '✅ POST performance: EXCELLENT (< 100ms)' 
  : results[3].latency?.mean < 200
  ? '⚠️  POST performance: ACCEPTABLE (100-200ms)'
  : '❌ POST performance: SLOW (> 200ms)'}

${results[0].latency?.mean < 50 
  ? '✅ GET performance: EXCELLENT (< 50ms)' 
  : results[0].latency?.mean < 100
  ? '⚠️  GET performance: ACCEPTABLE (50-100ms)'
  : '❌ GET performance: SLOW (> 100ms)'}

${results.some(r => r.errors > 0) 
  ? '⚠️  WARNING: Some endpoints reported errors during benchmarks' 
  : '✅ All endpoints completed without errors'}

💡 RECOMMENDATIONS:

1. Database Indexing:
   - Ensure indexes on 'region', 'safetyRating', and 'createdAt' fields
   - Check slow query logs if GET latency > 100ms

2. Caching Strategy:
   - Consider caching /api/logs results (data changes infrequently)
   - Cache region-specific queries with 5-minute TTL

3. Connection Pooling:
   - Verify MongoDB connection pool size (recommendation: 50-100)
   - Monitor connection reuse metrics

4. Load Distribution:
   - Current benchmark uses 10 connections for 10 seconds
   - Production should test with 50-100 concurrent connections
   - Monitor API for horizontal scaling needs if avg latency > 500ms

5. Query Optimization:
   - Profile database queries in production
   - Consider pagination for large result sets
   - Implement field projection to reduce payload size
`);

  } catch (error) {
    console.error('❌ Benchmark Error:', error.message);
    process.exit(1);
  }
}

// Run benchmarks
runBenchmarks().catch(console.error);
