// https://docs.expo.dev/guides/using-eslint/

const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");
// const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended"); //prettier를 eslint 안에서 실행시키겠다
// “eslint는 검사만 / prettier는 저장 시 실행”

const prettierConfig = require("eslint-config-prettier");

module.exports = defineConfig([
  globalIgnores(["dist/*"]),
  expoConfig,
  prettierConfig, // eslint 스타일 규칙 비활성화
  // eslintPluginPrettierRecommended,
  {
    ignores: ["dist/*"],
  },
  // babel.config.js 에서 Node.js 전역 변수를 사용
  {
    files: ["babel.config.js"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
]);
