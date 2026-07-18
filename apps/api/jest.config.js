module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/**/*.module.ts', // NestJS DI wiring (low-value to unit test)
    '!src/**/dto/**', // validation schemas only
    '!src/**/*.provider.ts', // infra providers (meili...)
    '!src/database/**', // PrismaService wrapper
    '!src/common/guards/**', // guard plumbing (covered by integration/e2e)
    '!src/**/*.controller.ts', // thin controllers — covered by E2E (Workstream B)
    '!src/**/*.strategy.ts', // passport strategies (integration)
    '!src/**/*.decorator.ts', // param decorators
  ],
  coverageThreshold: {
    './src': { lines: 70 },
  },
};