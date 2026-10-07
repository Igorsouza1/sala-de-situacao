/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/.agent/'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1', // Isso ajuda o Jest a entender o "@/" dos imports
    },
};
