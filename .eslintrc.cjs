// eslint-disable-next-line no-undef
module.exports = {
  env: {
    mocha: true,
    node: true,
    es2022: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  globals: {
    __dirname: true,
  },
  plugins: ['prettier'],
  extends: ['plugin:node/recommended', 'plugin:prettier/recommended'],
  rules: {
    'linebreak-style': ['error', 'unix'],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
      },
    ],
    'node/no-unpublished-import': [
      'error',
      {
        allowModules: ['chai', 'express', 'express-async-handler'],
      },
    ],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
  },
};
