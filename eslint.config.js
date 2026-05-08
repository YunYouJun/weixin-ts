// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    ignores: [
      'docs/api/**',
    ],
    rules: {
      // TypeScript allows same-name value + type declarations (different namespaces).
      // tsc already catches real redeclare errors, so this ESLint rule is redundant noise.
      'ts/no-redeclare': 'off',
    },
  },
)
