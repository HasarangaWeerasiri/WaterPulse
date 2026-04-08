/**
 * Memory and Performance Profiling for WaterPulse Task Management
 * 
 * This script measures:
 * - Memory usage (heap, rss, external)
 * - Operation performance (task service methods)
 * - Event loop lag
 * - Function execution time
 * 
 * Usage: npm run perf:task:memory
 */

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
      heapUsed: mem.heapUsed  - this.initialMemory.heapUsed,
      heapTotal: mem.heapTotal - this.initialMemory.heapTotal,
      rss: mem.rss             - this.initialMemory.rss,
      external: mem.external   - this.initialMemory.external,
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
    const startTime   = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      await fn();
    }

    const endTime   = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const duration    = endTime - startTime;
    const avgTime     = duration / iterations;
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
        const now           = Date.now();
        const expectedDelay = 100;
        const actualDelay   = now - lastCheck;
        const lag           = actualDelay - expectedDelay;

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
║      WaterPulse Task Management - Performance & Memory Profiling Report    ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

    // Memory Timeline
    console.log('\n📊 MEMORY USAGE TIMELINE\n');
    console.table(this.metrics.memory.map(m => ({
      'Check Point': m.label,
      'Heap Used':   m.heapUsed,
      'Delta':       m.heapUsedDelta,
      'Heap Total':  m.heapTotal,
      'RSS':         m.rss,
      'External':    m.external,
    })));

    // Operation Performance
    if (this.metrics.operations.length > 0) {
      console.log('\n⚡ OPERATION PERFORMANCE (1000 iterations)\n');
      console.table(this.metrics.operations.map(op => ({
        'Operation':       op.name,
        'Total (ms)':      op.totalTime,
        'Avg Per Op (ms)': op.avgTime,
        'Ops/Sec':         op.opsPerSecond,
        'Mem Delta':       op.memoryDelta,
      })));
    }

    // Event Loop Lag Analysis
    if (this.metrics.eventLoopLag.length > 0) {
      const lags   = this.metrics.eventLoopLag;
      const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length;
      const maxLag = Math.max(...lags);
      const minLag = Math.min(...lags);
      const p95Lag = lags.sort((a, b) => a - b)[Math.floor(lags.length * 0.95)];

      console.log('\n⏱️  EVENT LOOP LAG ANALYSIS (5 second sample)\n');
      console.table([{
        'Metric':  'Event Loop Lag (ms)',
        'Min':     minLag.toFixed(2),
        'Avg':     avgLag.toFixed(2),
        'P95':     p95Lag?.toFixed(2) || 'N/A',
        'Max':     maxLag.toFixed(2),
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
`);
  }
}

/**
 * Mock implementations for testing without actual database
 */
const mockService = {
  simulateTaskValidation: () => {
    // Simulate task validation logic (report exists, user role checks)
    const priority = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    return validStatuses.includes('pending') && ['low', 'medium', 'high'].includes(priority);
  },

  simulateDbQuery: async () => {
    // Simulate 5-10ms database query
    const delay = Math.random() * 5 + 5;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  simulateTaskStatusUpdate: async () => {
    // Simulate a task status update with report sync
    const delay = Math.random() * 8 + 8;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  generateLargeTaskArray: () => {
    return new Array(1000).fill(null).map((_, i) => ({
      id: i,
      title: `Task-${i}`,
      priority: ['low', 'medium', 'high'][i % 3],
      status: ['pending', 'in_progress', 'completed', 'cancelled'][i % 4],
      createdAt: new Date(Date.now() - i * 3600000),
    }));
  },
};

/**
 * Run comprehensive performance profiling for Task Management
 */
async function runProfilingSession() {
  const profiler = new PerformanceProfiler();

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║          WaterPulse Task Management - Performance Profiling Started        ║
║                     Running comprehensive benchmarks...                    ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  try {
    // Initial memory snapshot
    profiler.measureMemory('Initial State');

    console.log('\n⏳ Profiling task validation logic (1000 iterations)...');
    await profiler.measureOperation(
      'simulateTaskValidation',
      () => {
        mockService.simulateTaskValidation();
        return Promise.resolve();
      }
    );

    profiler.measureMemory('After Task Validation Tests');

    console.log('⏳ Profiling database query simulation (100 iterations)...');
    await profiler.measureOperation(
      'simulateDbQuery',
      () => mockService.simulateDbQuery(),
      100
    );

    profiler.measureMemory('After DB Query Tests');

    console.log('⏳ Profiling task status update simulation (100 iterations)...');
    await profiler.measureOperation(
      'simulateTaskStatusUpdate',
      () => mockService.simulateTaskStatusUpdate(),
      100
    );

    profiler.measureMemory('After Task Status Update Tests');

    console.log('⏳ Profiling large array generation and filtering (100 iterations)...');
    await profiler.measureOperation(
      'generateAndFilterLargeTaskArray',
      () => {
        const data = mockService.generateLargeTaskArray();
        return Promise.resolve(data.filter(t => t.priority === 'high' && t.status === 'pending'));
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
   - Add compound indexes on (assignedTo, status) and (reportId, status)
   - Use query projection to fetch only needed fields
   - Consider pagination for large task result sets
   - Monitor slow query logs

2. 💾 Memory Management:
   - Monitor heap growth during high task creation load
   - Implement data streaming for large task result sets
   - Use pagination to limit array sizes in memory
   - Clear unnecessary populate chains

3. ⚡ Event Loop Health:
   - Offload heavy report-status sync to background jobs
   - Break long-running operations into async chunks
   - Use Promise batching for multiple DB queries (e.g., user validation)
   - Monitor and profile in production

4. 📊 Monitoring Strategy:
   - Set up APM (Application Performance Monitoring)
   - Track P95/P99 latencies for task creation in production
   - Monitor database connection pool utilization
   - Alert on event loop lag > 100ms

5. 🚀 Scalability:
   - Implement horizontal scaling at 50+ concurrent users
   - Use caching layer (Redis) for authority list
   - Consider read replicas for task queries at high load
   - Implement rate limiting per admin user
`);

  } catch (error) {
    console.error('❌ Profiling Error:', error);
    process.exit(1);
  }
}

// Execute profiling
runProfilingSession().catch(console.error);
