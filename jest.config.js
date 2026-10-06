const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/tests/unit/**/*.test.{ts,tsx}"],
  collectCoverageFrom: [
    "src/{data,stores,hooks,lib}/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
};

module.exports = createJestConfig(customJestConfig);
