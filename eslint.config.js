// ESLint flat config for TypeScript, Vue SFCs, and Node scripts.
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"
import prettier from "eslint-config-prettier"
import globals from "globals"

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        ...globals.node,
        chrome: "readonly",
      },
    },
  },
  {
    // UpperCamelCase file names are a project convention, including single-word component names.
    files: ["**/*.vue"],
    rules: { "vue/multi-word-component-names": "off" },
  },
  prettier,
)
