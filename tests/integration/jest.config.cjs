module.exports = {
  rootDir: '../..',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/*.integration.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  maxWorkers: 1,
};
