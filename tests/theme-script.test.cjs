const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { load } = require('./ts-loader.cjs');
const { DEFAULT_THEME, THEME_SCRIPT, THEME_STORAGE_KEY } = load(path.resolve('app/lib/theme.ts'));

function run(stored) {
  const root = {
    attrs: {},
    style: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };
  vm.runInNewContext(THEME_SCRIPT, {
    document: { documentElement: root },
    localStorage: {
      getItem: (key) => (key === THEME_STORAGE_KEY ? stored : null),
    },
  });
  return root;
}

test('theme script applies a stored preference before hydration', () => {
  const light = run('light');
  assert.equal(light.attrs['data-theme'], 'light');
  assert.equal(light.style.colorScheme, 'light');

  const dark = run('dark');
  assert.equal(dark.attrs['data-theme'], 'dark');
  assert.equal(dark.style.colorScheme, 'dark');
});

test('theme script falls back to the default for missing or invalid values', () => {
  assert.equal(run(null).attrs['data-theme'], DEFAULT_THEME);
  assert.equal(run('system').attrs['data-theme'], DEFAULT_THEME);
});

test('theme script survives unavailable storage', () => {
  const root = {
    style: {},
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };
  vm.runInNewContext(THEME_SCRIPT, {
    document: { documentElement: root },
    localStorage: {
      getItem() {
        throw new Error('blocked');
      },
    },
  });
  assert.equal(root.attrs['data-theme'], undefined);
});

test('theme script is a plain string without bundled helper references', () => {
  assert.equal(/__name|__defProp/.test(THEME_SCRIPT), false);
});
