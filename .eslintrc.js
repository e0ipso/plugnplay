module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  plugins: ['flowtype'],
  extends: ['plugin:prettier/recommended', 'plugin:flowtype/recommended'],
};
