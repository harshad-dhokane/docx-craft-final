/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    '@remix-run/eslint-config',
    '@remix-run/eslint-config/node',
    'plugin:prettier/recommended', // Integrates Prettier with ESLint
  ],
  // You can add project-specific rules here if needed
  // rules: {
  //   // example: 'prettier/prettier': ['error', { singleQuote: true }]
  // },
};
