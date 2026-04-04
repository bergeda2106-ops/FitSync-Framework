/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': '@swc/jest',
  },
  modulePathIgnorePatterns: ['<rootDir>/venv/', '<rootDir>/node_modules/'],
};
