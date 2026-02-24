import antfu from "@antfu/eslint-config";

export default antfu({
  type: "app",
  react: true,
  typescript: true,
  formatters: true,
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
  ignores: ["./src/routeTree.gen.ts"],
}, {
  rules: {
    "antfu/no-top-level-await": ["off"],
    "import/no-mutable-exports": ["off"],
    "no-console": ["off"],
    "node/prefer-global/process": ["off"],
    "perfectionist/sort-imports": ["error"],
    "react-refresh/only-export-components": ["off"],
    "ts/consistent-type-definitions": ["error", "type"],
    "unicorn/filename-case": ["error", {
      case: "kebabCase",
      ignore: ["README.md"],
    }],
  },
});
