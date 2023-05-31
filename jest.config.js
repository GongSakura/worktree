/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  transform: {
    "^.+\\.m?[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [],
};
