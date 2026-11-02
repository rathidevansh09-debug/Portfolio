// ESLint flat config (ARCHITECTURE §11.1; AGENTS §7, §14.1).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/', 'node_modules/', 'References/', 'test-results/', 'playwright-report/'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    rules: {
      // Owner-approved React restrictions using ESLint's built-in rule (no extra package).
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'dangerouslySetInnerHTML is not allowed: visitor or content text must never be inserted as HTML (AGENTS §14.1).',
        },
        {
          selector: "JSXAttribute[name.name='target'][value.value='_blank']",
          message:
            'Use the shared external-link component for target="_blank" so rel="noopener noreferrer" is always applied (AGENTS §14.1).',
        },
      ],
    },
  },
]);
