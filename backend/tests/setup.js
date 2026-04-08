/**
 * Jest Setup File
 * Runs before all test suites
 */

// Suppress console logs during tests (optional)
// Uncomment to reduce noise in test output
// global.console = {
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// };

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/waterpulse_test";
process.env.JWT_SECRET = "test_jwt_secret_key_for_testing";

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to avoid cluttering test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("[SmsService]")
    ) {
      // Ignore SMS service logs in tests
      return;
    }
    originalError.call(console, ...args);
  });

  console.warn = jest.fn((...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Failed to") || args[0].includes("Deprecated"))
    ) {
      // Ignore some warnings in tests
      return;
    }
    originalWarn.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
