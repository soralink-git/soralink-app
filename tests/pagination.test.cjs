const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const { load: loadModule, req } = require('./ts-loader.cjs');
const { readPage, appendUnique, cursorSchema } = loadModule(path.resolve('app/lib/pagination.ts'));
const { readHistory, requestNotifications } = loadModule(path.resolve('app/lib/history.ts'));
const stamp = '2026-10-15T12:00:00.000Z';
function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of fs
    .readdirSync('drizzle')
    .filter((name) => name.endsWith('.sql'))
    .sort())
    sqlite.exec(fs.readFileSync(path.join('drizzle', name), 'utf8'));
  const DB = {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) {
          values = args;
          return this;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...values) };
        },
        async first() {
          return sqlite.prepare(sql).get(...values) || null;
        },
        async run() {
          return { meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } };
        },
      };
    },
  };
  const addRequest = sqlite.prepare(
    'INSERT INTO requests(id,profile,kind,name,phone,message,created) VALUES(?,?,?,?,?,?,?)',
  );
  const addOrder = sqlite.prepare('INSERT INTO orders(id,owner,plan,created) VALUES(?,?,?,?)');
  for (let i = 0; i < 105; i++) {
    const id = String(i).padStart(3, '0');
    addRequest.run('request-' + id, 'card', 'devis', 'Test', '0600000000', '', stamp);
    addRequest.run('contact-' + id, 'card', 'contact', 'Test', '0600000000', '', stamp);
    addOrder.run('order-' + id, 'owner', 'Digital', stamp);
  }
  addRequest.run('foreign-request', 'other-card', 'devis', 'Private', '0600000000', '', stamp);
  addOrder.run('foreign-order', 'other-owner', 'Digital', stamp);
  return { sqlite, DB };
}

test('all histories span three stable pages, including tied timestamps, without another owner’s rows', async () => {
  const f = fixture();
  try {
    for (const kind of ['requests', 'contacts', 'orders']) {
      const first = await readHistory(f.DB, 'owner', 'card', kind);
      const second = await readHistory(f.DB, 'owner', 'card', kind, first.nextCursor);
      const third = await readHistory(f.DB, 'owner', 'card', kind, second.nextCursor);
      assert.deepEqual([first.items.length, second.items.length, third.items.length], [50, 50, 5]);
      const ids = [...first.items, ...second.items, ...third.items].map((item) => item.id);
      assert.equal(new Set(ids).size, 105);
      assert.ok(
        ids.every((id) =>
          id.startsWith(
            kind === 'contacts' ? 'contact-' : kind === 'orders' ? 'order-' : 'request-',
          ),
        ),
      );
      assert.equal(third.nextCursor, null);
    }
    assert.equal((await readHistory(f.DB, 'new-owner', undefined, 'requests')).items.length, 0);
    assert.equal((await readHistory(f.DB, 'new-owner', undefined, 'orders')).items.length, 0);
  } finally {
    f.sqlite.close();
  }
});

test('insertion ahead of a cursor and deletion of the cursor row do not shift the next page', async () => {
  const f = fixture();
  try {
    const first = await readHistory(f.DB, 'owner', 'card', 'contacts');
    f.sqlite.prepare('DELETE FROM requests WHERE id=?').run(first.items.at(-1).id);
    f.sqlite
      .prepare(
        'INSERT INTO requests(id,profile,kind,name,phone,message,created) VALUES(?,?,?,?,?,?,?)',
      )
      .run('new-contact', 'card', 'contact', 'New', '0600000000', '', '2026-10-15T13:00:00.000Z');
    const second = await readHistory(f.DB, 'owner', 'card', 'contacts', first.nextCursor);
    assert.equal(second.items.length, 50);
    assert.equal(second.items[0].id, 'contact-054');
    assert.equal(
      appendUnique(first.items, [...first.items.slice(-1), ...second.items]).length,
      100,
    );
    assert.equal(
      (await readHistory(f.DB, 'other-owner', 'other-card', 'contacts', first.nextCursor)).items
        .length,
      0,
    );
  } finally {
    f.sqlite.close();
  }
});

test('notifications follow old request pages, with a bounded latest pair and profile isolation', async () => {
  const f = fixture();
  try {
    const add = f.sqlite.prepare(
      'INSERT INTO notifications(id,profile,request_id,recipient,subject,body,created,next_attempt) VALUES(?,?,?,?,?,?,?,?)',
    );
    for (const id of ['a', 'b', 'c'])
      add.run(id, 'card', 'request-001', 'test@example.test', '', '', stamp, stamp);
    add.run('foreign', 'other-card', 'request-001', 'private@example.test', '', '', stamp, stamp);
    const result = await requestNotifications(f.DB, 'card', [{ id: 'request-001' }]);
    assert.deepEqual(
      Array.from(result, (item) => item.id),
      ['c', 'b'],
    );
    assert.equal((await requestNotifications(f.DB, 'card', [])).length, 0);
  } finally {
    f.sqlite.close();
  }
});

function adminRoute(DB, auth) {
  const module = { exports: {} };
  const validation = loadModule(path.resolve('app/lib/api-validation.ts'));
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('app/api/admin/route.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      module,
      exports: module.exports,
      Date,
      URL,
      Object,
      require(name) {
        if (name.endsWith('/server'))
          return {
            db: () => DB,
            identity: async () => auth,
            json: (body, status = 200) => Response.json(body, { status }),
          };
        if (name.endsWith('/pagination')) return { readPage };
        if (name.endsWith('/catalog-menu'))
          return loadModule(path.resolve('app/lib/catalog-menu.ts'));
        if (name.endsWith('/api-validation')) return validation;
        throw Error(name);
      },
    },
  );
  return module.exports;
}
test('admin search reaches clients beyond page one, literal metacharacters stay literal, totals are global', async () => {
  const f = fixture();
  try {
    const add = f.sqlite.prepare(
      'INSERT INTO profiles(id,owner,data,updated,email,expires) VALUES(?,?,?,?,?,?)',
    );
    for (let i = 0; i < 65; i++)
      add.run(
        'profile-' + String(i).padStart(3, '0'),
        'client-' + i,
        JSON.stringify({ name: i === 0 ? "Oujda %_'" : 'Client ' + i }),
        stamp,
        'client' + i + '@example.test',
        '2020-01-01T00:00:00.000Z',
      );
    const route = adminRoute(f.DB, { user: { userId: 'admin' }, admin: true });
    const get = async (query = '') => {
      const response = await route.GET(new Request('https://example.test/api/admin?' + query));
      assert.equal(response.status, 200);
      return response.json();
    };
    const first = await get();
    assert.equal(first.profiles.length, 50);
    assert.equal(first.orders.length, 50);
    assert.equal(first.stats.clients, 65);
    assert.equal(first.stats.pendingOrders, 106);
    assert.equal(first.stats.expired, 65);
    const next = await get(
      new URLSearchParams({ section: 'profiles', cursor: first.pages.profiles.nextCursor }),
    );
    assert.equal(next.profiles.length, 15);
    assert.equal(next.pages.profiles.nextCursor, null);
    const search = await get(new URLSearchParams({ search: "%_'" }));
    assert.equal(search.profiles.length, 1);
    assert.equal(search.profiles[0].id, 'profile-000');
    assert.equal(search.stats.clients, 65);
    const orderNext = await get(
      new URLSearchParams({ section: 'orders', cursor: first.pages.orders.nextCursor }),
    );
    assert.equal(orderNext.orders.length, 50);
    assert.equal(orderNext.profiles.length, 0);
    for (const auth of [
      { user: null, admin: false },
      { user: { userId: 'client' }, admin: false },
    ])
      assert.equal(
        (await adminRoute(f.DB, auth).GET(new Request('https://example.test/api/admin'))).status,
        auth.user ? 403 : 401,
      );
  } finally {
    f.sqlite.close();
  }
});

test('malformed cursors are rejected and load-more labels follow the selected language', () => {
  for (const cursor of ['null', '{}', '[]', '["2026-10-15", "id"]', 'x'.repeat(500)])
    assert.equal(cursorSchema.safeParse(cursor).success, false);
  const React = req('react');
  const { renderToStaticMarkup } = req('react-dom/server');
  const LoadMore = loadModule(path.resolve('app/load-more.tsx')).default;
  for (const ar of [true, false]) {
    const html = renderToStaticMarkup(
      React.createElement(LoadMore, {
        ar,
        busy: false,
        page: { nextCursor: 'next' },
        onClick() {},
      }),
    );
    assert.match(html, ar ? /بيّن المزيد/ : /Afficher plus/);
    assert.doesNotMatch(html, ar ? /Afficher plus/ : /بيّن المزيد/);
  }
  assert.equal(
    renderToStaticMarkup(
      React.createElement(LoadMore, {
        ar: false,
        busy: false,
        page: { nextCursor: null },
        onClick() {},
      }),
    ),
    '',
  );
});
