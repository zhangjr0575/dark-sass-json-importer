module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  // 覆盖率统计 dist 构建产物（源码为 ESM，测试跑在 dist CJS 产物上）
  collectCoverageFrom: [
    'dist/**/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
