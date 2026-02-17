import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    rules: {
      "no-unused-vars": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
