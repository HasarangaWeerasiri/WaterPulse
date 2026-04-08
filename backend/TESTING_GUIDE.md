# WaterLogs Testing - Quick Start

## 📦 Installation

Before running tests, install dependencies:

```bash
cd backend

# Install Jest and testing libraries
npm install --save-dev jest @babel/preset-env babel-jest @babel/core
npm install --save-dev supertest

# Verify installation
npm test -- --version
```

## 🚀 Running Tests Quickly

### Run All Tests
```bash
npm test
```

### Run Only Unit Tests
```bash
npm test -- tests/waterLogs_Tests/unit
```

### Run Only Integration Tests
```bash
npm test -- tests/waterLogs_Tests/integration
```

### Run Tests in Watch Mode (Auto-refresh)
```bash
npm test -- --watch
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- tests/waterLogs_Tests/unit/waterLogService.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- -t "Safety Rating"
```

## 📊 What Gets Tested

### Unit Tests (Service Layer)
- ✅ pH & Turbidity Validation (0-14 range, ≥0 turbidity)
- ✅ Safety Rating Logic (Safe, Warning, Unsafe categorization)
- ✅ Database Queries (filtering, sorting, retrieval)
- ✅ SMS Notification Logic (message formatting, conditions)
- ✅ Error Handling

### Integration Tests (API Endpoints)
- ✅ Log Creation with auto-validation
- ✅ Role-Based Authorization (who can do what)
- ✅ Filtering & Retrieval (by region, safety rating, etc)
- ✅ Cross-Model Interactions (logs updating reports/tasks)
- ✅ Update & Delete Operations
- ✅ Error Scenarios
- ✅ Edge Cases

## 🎯 Test Results You'll See

Successful run:
```
PASS  tests/waterLogs_Tests/unit/waterLogService.test.js (2.3s)
PASS  tests/waterLogs_Tests/integration/waterLogEndpoints.test.js (1.8s)

Test Suites: 2 passed, 2 total
Tests:       110 passed, 110 total
Time:        4.1s
```

## 🐛 Troubleshooting

### Tests not found?
```bash
# Check your folder structure
ls -la tests/waterLogs_Tests/
# Should see: unit/  integration/  performance/  README.md
```

### Module not found errors?
```bash
# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### Babel/Transform errors?
```bash
# Verify .babelrc exists in backend folder
cat .babelrc
# Should show babel configuration
```

### Port/Connection errors?
```bash
# These tests are mocked and don't need MongoDB running!
# But if you see connection errors, check jest.config.js
# Tests should run without external services
```

## 📈 Coverage Goals

Target these coverage metrics:
- **Statements**: >85%
- **Branches**: >80%
- **Functions**: >85%
- **Lines**: >85%

View coverage report:
```bash
npm test -- --coverage
# Check coverage/ folder for HTML report
```

## 📚 Test Files Location

```
backend/
├── tests/
│   ├── waterLogs_Tests/
│   │   ├── unit/
│   │   │   └── waterLogService.test.js     (45+ tests)
│   │   ├── integration/
│   │   │   └── waterLogEndpoints.test.js   (65+ tests)
│   │   └── README.md
│   └── setup.js
├── jest.config.js
├── .babelrc
└── package.json
```

## 🔧 Common Commands

```bash
# Run tests and update snapshots
npm test -- -u

# Run a single test suite
npm test -- waterLogService.test.js

# Run with detailed output
npm test -- --verbose

# Run and exit (CI mode)
npm test -- --ci

# Profile test performance
npm test -- --logHeapUsage
```

## ✅ Validation Checklist

Before committing code:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No console errors (except expected mocks)
- [ ] Coverage report shows >80%
- [ ] No warnings about deprecated functions

Run this:
```bash
npm test -- --coverage --passWithNoTests
```

## 🎓 Understanding Test Output

When you see in test names:
- ✓ (green checkmark) = Test passed
- ✕ (red X) = Test failed
- ⊙ (circle) = Test skipped (with .skip)

Example:
```
PASS  unit/waterLogService.test.js
  ✓ should calculate Safe rating when pH=7 and turbidity=3 (5ms)
  ✓ should calculate Unsafe rating when pH=5 and turbidity=15 (3ms)
  ✕ should handle invalid pH input (failed)
```

## 📞 Support

For detailed test documentation:
```bash
cat tests/waterLogs_Tests/README.md
```

---

**Happy Testing!** 🎉 Tests run fast, catch bugs early, and give you confidence!
