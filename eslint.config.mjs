import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import { any } from "joi";


export default [
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  any
];