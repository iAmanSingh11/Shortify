export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^ioredis$': 'ioredis-mock',
  },
  testTimeout: 30000,
  verbose: true,
};
