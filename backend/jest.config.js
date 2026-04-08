export default {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "services/waterLogService.js",
    "controllers/waterLogController.js",
    "models/waterLog.js",
    "routes/waterLogRoutes.js",
    "services/reportService.js",
    "controllers/reportController.js",
    "models/contaminationReport.js",
    "routes/reportRoutes.js",
    "!**/node_modules/**",
    "!**/vendor/**"
  ],
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  testPathIgnorePatterns: ["/node_modules/", "/frontend/"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  transform: {
    "^.+\\.js$": ["babel-jest"]
  },
  testTimeout: 10000,
  verbose: true,
  bail: false,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  moduleDirectories: ["node_modules", "<rootDir>"]
};
