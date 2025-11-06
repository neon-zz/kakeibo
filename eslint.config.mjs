import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import eslintPluginPrettier from "eslint-plugin-prettier";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,jsx}"],
     plugins: { js, react: pluginReact, eslintPluginPrettier },
     languageOptions: { 
      globals: globals.browser,
    },
  extends: [
    pluginReact.configs.flat.recommended,
    "plugin:prettier/recommended" ,
  ],
  rules: {
    "prettier/prettier": ["error"],
  },
},
]);
