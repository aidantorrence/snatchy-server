module.exports = {
    roots: ['<rootDir>/test'],
    testRegex: '\\.test.(ts)$',
    testEnvironment: 'node',
    transform: {
      '^.+\\.(ts)$': 'ts-jest'
    }
  }