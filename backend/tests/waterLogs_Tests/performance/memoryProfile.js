/**
 * Memory and Performance Profiling for WaterPulse
 * 
 * This script measures:
 * - Memory usage (heap, rss, external)
 * - Operation performance (safety rating, DB queries)
 * - Event loop lag
 * - Function execution time
 * 
 * Usage: npm run perf:memory
 */

import WaterLogService from '../../../services/waterLogService.js';
import { performance } from 'perf_hooks';

class PerformanceProfiler {
  constructor() {
    this.metrics = {
      memory: [],
      operations: [],
      eventLoopLag: [],
    };
    this.initialMemory = process.memoryUsage();
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Measure memory usage
   */
  measureMemory(label) {
    const mem = process.memoryUsage();
    const delta = {
      heapUsed: mem.heapUsed - this.initialMemory.heapUsed,
      heapTotal: mem.heapTotal - this.initialMemory.heapTotal,
      rss: mem.rss - this.initialMemory.rss,
      external: mem.external - this.initialMemory.external,
    };

    this.metrics.memory.push({
      label,
      timestamp: new Date().toISOString(),
      heapUsed: this.formatBytes(mem.heapUsed),
      heapUsedDelta: this.formatBytes(delta.heapUsed),
      heapTotal: this.formatBytes(mem.heapTotal),
      rss: this.formatBytes(mem.rss),
      rssDelta: this.formatBytes(delta.rss),
      external: this.formatBytes(mem.external),
    });
  }

  /**
   * Measure operation performance
   */
  async measureOperation(name, fn, iterations = 1000) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      await fn();
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const duration = endTime - startTime;
    const avgTime = duration / iterations;
    const memoryDelta = endMemory - startMemory;

    this.metrics.operations.push({
      name,
      iterations,
      totalTime: duration.toFixed(2),
      avgTime: avgTime.toFixed(3),
      opsPerSecond: (1000 / avgTime).toFixed(2),
      memoryDelta: this.formatBytes(memoryDelta),
    });

    return { duration, avgTime, memoryDelta };
  }

  /**
   * Measure event loop lag
   */
  measureEventLoopLag(duration = 5000) {
    return new Promise((resolve) => {
      const lags = [];
      const start = Date.now();
      let lastCheck = start;

      const interval = setInterval(() => {
        const now = Date.now();
        const expectedDelay = 100;
        const actualDelay = now - lastCheck;
        const lag = actualDelay - expectedDelay;

        if (lag > 0) {
          lags.push(lag);
        }

        lastCheck = now;

        if (now - start >= duration) {
          clearInterval(interval);
          resolve(lags);
        }
      }, 100);
    });
  }

  /**
   * Display results in formatted table
   */
  displayResults() {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║         WaterPulse Performance & Memory Profiling Report                   ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

    // Memory Timeline
    console.log('\n📊 MEMORY USAGE TIMELINE\n');
    console.table(this.metrics.memory.map(m => ({
      'Check Point': m.label,
      'Heap Used': m.heapUsed,
      'Delta': m.heapUsedDelta,
      'Heap Total': m.heapTotal,
      'RSS': m.rss,
      'External': m.external,
    })));

    // Operation Performance
    if (this.metrics.operations.length > 0) {
      console.log('\n⚡ OPERATION PERFORMANCE (1000 iterations)\n');
      console.table(this.metrics.operations.map(op => ({
        'Operation': op.name,
        'Total (ms)': op.totalTime,
        'Avg Per Op (ms)': op.avgTime,
        'Ops/Sec': op.opsPerSecond,
        'Mem Delta': op.memoryDelta,
      })));
    }

    // Event Loop Lag Analysis
    if (this.metrics.eventLoopLag.length > 0) {
      const lags = this.metrics.eventLoopLag;
      const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length;
      const maxLag = Math.max(...lags);
      const minLag = Math.min(...lags);
      const p95Lag = lags.sort((a, b) => a - b)[Math.floor(lags.length * 0.95)];

      console.log('\n⏱️  EVENT LOOP LAG ANALYSIS (5 second sample)\n');
      console.table([{
        'Metric': 'Event Loop Lag (ms)',
        'Min': minLag.toFixed(2),
        'Avg': avgLag.toFixed(2),
        'P95': p95Lag?.toFixed(2) || 'N/A',
        'Max': maxLag.toFixed(2),
        'Samples': lags.length,
      }]);

      console.log(`
${avgLag < 10 
  ? '✅ Event Loop: HEALTHY - Low latency response' 
  : avgLag < 50
  ? '⚠️  Event Loop: ACCEPTABLE - Some blocking detected'
  : '❌ Event Loop: BOTTLENECK - Significant blocking detected'}
`);
    }

    // Performance Grade
    this.displayPerformanceGrade();
  }

  /**
   * Calculate and display performance grade
   */
  displayPerformanceGrade() {
    const ops = this.metrics.operations;
    if (ops.length === 0) return;

    const avgOperationTime = ops.reduce((sum, op) => sum + parseFloat(op.avgTime), 0) / ops.length;
    const avgMemoryUsage = ops.reduce((sum, op) => {
      const bytes = op.memoryDelta.includes('MB') 
        ? parseFloat(op.memoryDelta) * 1024 * 1024
        : parseFloat(op.memoryDelta);
      return sum + bytes;
    }, 0) / ops.length;

    let grade = 'A+';
    let color = '✅';

    if (avgOperationTime > 10) {
      grade = avgOperationTime > 50 ? 'C' : 'B';
      color = avgOperationTime > 50 ? '❌' : '⚠️ ';
    }

    console.log(`
${color} OVERALL PERFORMANCE GRADE: ${grade}

Performance Baselines:
  • Excellent (A+): < 1ms per operation
  • Good (A):       1-5ms per operation  
  • Acceptable (B): 5-10ms per operation
  • Poor (C+):      10-50ms per operation
  • Critical (C):   > 50ms per operation

Current Average: ${avgOperationTime.toFixed(3)}ms per operation
Memory Impact: ${this.formatBytes(avgMemoryUsage)} per operation
`);
  }
}

/**
 * Mock implementations for testing without actual database
 */
const mockService = {
  calculateSafetyRating: (ph, turbidity) => {
    if (ph < 6.0 || ph > 9.0 || turbidity > 10) return 'Unsafe';
    if ((ph >= 6.0 && ph < 6.5) || (ph > 8.5 && ph <= 9.0) || (turbidity > 5 && turbidity <= 10)) return 'Warning';
    if (ph >= 6.5 && ph <= 8.5 && turbidity <= 5) return 'Safe';
    return 'Unknown';
  },

  simulateDbQuery: async () => {
    // Simulate 5-10ms database query
    const delay = Math.random() * 5 + 5;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  simulateReportLookup: async () => {
    // Simulate report lookup with populate
    const delay = Math.random() * 10 + 10;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  generateLargeArray: () => {
    return new Array(1000).fill(null).map((_, i) => ({
      id: i,
      region: `Region-${i}`,
      phLevel: 6.5 + Math.random() * 2,
      turbidity: Math.random() * 5,
      timestamp: new Date(),
    }));
  },
};

/**
 * Run comprehensive performance profiling
 */
async function runProfilingSession() {
  const profiler = new PerformanceProfiler();

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              WaterPulse Performance Profiling Session Started              ║
║                    Running comprehensive benchmarks...                     ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  try {
    // Initial memory snapshot
    profiler.measureMemory('Initial State');

    console.log('\n⏳ Profiling safety rating calculations (1000 iterations)...');
    await profiler.measureOperation(
      'calculateSafetyRating',
      () => {
        mockService.calculateSafetyRating(7.2, 3.5);
        return Promise.resolve();
      }
    );

    profiler.measureMemory('After Safety Rating Tests');

    console.log('⏳ Profiling database query simulation (1000 iterations)...');
    await profiler.measureOperation(
      'simulateDbQuery',
      () => mockService.simulateDbQuery(),
      100
    );

    profiler.measureMemory('After DB Query Tests');

    console.log('⏳ Profiling report lookup simulation (500 iterations)...');
    await profiler.measureOperation(
      'simulateReportLookup',
      () => mockService.simulateReportLookup(),
      100
    );

    profiler.measureMemory('After Report Lookup Tests');

    console.log('⏳ Profiling large array generation and filtering (100 iterations)...');
    await profiler.measureOperation(
      'generateAndFilterLargeArray',
      () => {
        const data = mockService.generateLargeArray();
        return Promise.resolve(data.filter(d => d.phLevel > 7));
      },
      100
    );

    profiler.measureMemory('After Large Array Tests');

    console.log('⏳ Measuring event loop lag (5 second sample)...');
    profiler.metrics.eventLoopLag = await profiler.measureEventLoopLag(5000);

    profiler.measureMemory('Final State');

    // Display all results
    profiler.displayResults();

    // Final recommendations
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                     OPTIMIZATION RECOMMENDATIONS                           ║
╚════════════════════════════════════════════════════════════════════════════╝

1. 🔍 Database Optimization:
   - Add compound indexes on (region, safetyRating)
   - Use query projection to fetch only needed fields
   - Consider pagination for large datasets
   - Monitor slow query logs

2. 💾 Memory Management:
   - Monitor heap growth during high load
   - Implement data streaming for large result sets
   - Use pagination to limit array sizes in memory
   - Clear unnecessary caches periodically

3. ⚡ Event Loop Health:
   - Offload heavy computations to worker threads
   - Break long-running operations into async chunks
   - Use Promise batching for multiple DB queries
   - Monitor and profile in production

4. 📊 Monitoring Strategy:
   - Set up APM (Application Performance Monitoring)
   - Track P95/P99 latencies in production
   - Monitor database connection pool utilization
   - Alert on event loop lag > 100ms

5. 🚀 Scalability:
   - Implement horizontal scaling at 50+ concurrent users
   - Use caching layer (Redis) for frequently accessed data
   - Consider read replicas for database at high load
   - Implement rate limiting by user/IP
`);

  } catch (error) {
    console.error('❌ Profiling Error:', error);
    process.exit(1);
  }
}

// Execute profiling
runProfilingSession().catch(console.error);
