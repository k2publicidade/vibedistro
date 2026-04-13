import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.service.ts', '**/*.controller.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@vibedistro/types$': '<rootDir>/../../../packages/types/src',
    '^@vibedistro/database$': '<rootDir>/../../../packages/database/src/generated',
    '^@vibedistro/config$': '<rootDir>/../../../packages/config/src',
    '^@vibedistro/config/(.*)$': '<rootDir>/../../../packages/config/src/$1',
  },
};

export default config;
