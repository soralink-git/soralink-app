const fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  ts = require('typescript');
const req = require('node:module').createRequire(
  require('node:path').resolve(__dirname, '../package.json'),
);
const cache = {};
function load(f) {
  if (cache[f]) return cache[f].exports;
  const m = { exports: {} };
  cache[f] = m;
  const code = ts.transpileModule(fs.readFileSync(f, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      module: m,
      exports: m.exports,
      require: (n) => {
        if (!n.startsWith('.')) return req(n);
        const b = path.resolve(path.dirname(f), n);
        return load(['.ts', '.tsx', '.js'].map((ext) => b + ext).find(fs.existsSync) || b);
      },
      Date,
      URL,
      URLSearchParams,
      Intl,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      console,
      Blob,
      Response,
      Request,
      crypto: globalThis.crypto,
    },
    { filename: f },
  );
  return m.exports;
}
module.exports = { load, req };
