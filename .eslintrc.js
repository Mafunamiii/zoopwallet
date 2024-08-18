module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:prettier/recommended"
    ],
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": ["prettier"],
    "rules": {
        "prettier/prettier": "error",
        "no-unused-vars": "warn",
        "indent": ["error", 4]
    }
};