module.exports = {
  "extends": "airbnb-base",
  "plugins": [
      "import"
  ],
  "rules" : {
      "arrow-body-style" : "warn",
      "comma-dangle": "warn",
      "no-console":"off",
      "import/no-extraneous-dependencies": ["error", { "devDependencies": true }],
      "class-methods-use-this": "off",
      "max-len": "off",
    }
};