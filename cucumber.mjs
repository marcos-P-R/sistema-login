export default {
  default: [
    'tests/bdd/features/**/*.feature',
    '--import',
    'tests/bdd/support/hooks.ts',
    '--import',
    'tests/bdd/steps/**/*.steps.ts',
    '--format',
    'progress-bar',
    '--publish-quiet',
  ].join(' '),
};