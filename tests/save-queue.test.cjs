const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { createSaveQueue } = load(path.resolve('app/lib/save-queue.ts'));
const snap = (name) => ({ data: { name }, published: false });
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
function fixture(send) {
  let now = 0,
    id = 0;
  const timers = new Map(),
    states = [],
    requests = [];
  const queue = createSaveQueue({
    schedule: (fn, delay) => {
      const key = ++id;
      timers.set(key, { fn, at: now + delay });
      return key;
    },
    cancel: (key) => timers.delete(key),
    onState: (s) => states.push(s),
    send: (body, revision) => {
      requests.push({ body, revision });
      return send
        ? send(body, revision)
        : Promise.resolve({ id: 'card', revision: 'r' + requests.length });
    },
  });
  queue.reset(snap('Initial'), 'r0', true);
  return {
    queue,
    requests,
    states,
    timers,
    advance: async (n) => {
      now += n;
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= now);
      for (const [key, timer] of due) {
        timers.delete(key);
        timer.fn();
      }
      await settle();
    },
  };
}
test('hydration never writes, rapid typing is debounced and only the latest snapshot is saved', async () => {
  const f = fixture();
  await f.advance(1000);
  assert.equal(f.requests.length, 0);
  f.queue.update(snap('A'));
  await f.advance(600);
  f.queue.update(snap('ABC'));
  await f.advance(799);
  assert.equal(f.requests.length, 0);
  await f.advance(1);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].body.data.name, 'ABC');
  assert.equal(f.requests[0].revision, 'r0');
  assert.equal(f.queue.state().status, 'saved');
  assert.equal(f.queue.isDirty(), false);
});
test('edits during a slow request stay pending and use its acknowledged revision on the next write', async () => {
  const pending = [];
  const f = fixture(() => new Promise((resolve) => pending.push(resolve)));
  f.queue.update(snap('First'));
  await f.advance(800);
  f.queue.update(snap('Latest'));
  assert.equal(f.requests.length, 1);
  assert.equal(f.queue.state().status, 'saving');
  pending.shift()({ id: 'card', revision: 'r1' });
  await settle();
  assert.equal(f.queue.state().status, 'pending');
  assert.equal(f.queue.isDirty(), true);
  await f.advance(799);
  assert.equal(f.requests.length, 1);
  await f.advance(1);
  assert.equal(f.requests[1].body.data.name, 'Latest');
  assert.equal(f.requests[1].revision, 'r1');
  pending.shift()({ id: 'card', revision: 'r2' });
  await settle();
  assert.equal(f.queue.state().status, 'saved');
});
test('manual and automatic saves share one flight and flush the latest edit without duplicate writes', async () => {
  const pending = [];
  const f = fixture(() => new Promise((resolve) => pending.push(resolve)));
  f.queue.update(snap('First'));
  await f.advance(800);
  const manual = f.queue.flush();
  f.queue.update(snap('Second'));
  const another = f.queue.flush();
  assert.equal(f.requests.length, 1);
  pending.shift()({ id: 'card', revision: 'r1' });
  await settle();
  assert.equal(f.requests.length, 2);
  assert.equal(f.requests[1].body.data.name, 'Second');
  pending.shift()({ id: 'card', revision: 'r2' });
  assert.equal(await manual, true);
  assert.equal(await another, true);
  await f.advance(1000);
  assert.equal(f.requests.length, 2);
});
test('upload pauses hold writes until completion and incomplete required fields are never sent', async () => {
  const f = fixture();
  f.queue.pause(true);
  f.queue.update(snap('Photo imported'));
  await f.advance(1000);
  assert.equal(f.requests.length, 0);
  assert.equal(await f.queue.flush(), false);
  f.queue.pause(false);
  await f.advance(800);
  assert.equal(f.requests.length, 1);
  f.queue.update(snap(''));
  await f.advance(800);
  assert.equal(f.requests.length, 1);
  assert.equal(f.queue.state().status, 'invalid');
  assert.equal(f.queue.isDirty(), true);
  f.queue.update(snap('Completed'));
  await f.advance(800);
  assert.equal(f.requests.length, 2);
});
test('offline failures never claim success or loop and reconnect retries the current snapshot', async () => {
  let offline = true;
  const f = fixture(async () => {
    if (offline) throw Object.assign(new Error('offline'), { status: 'offline' });
    return { id: 'card', revision: 'r2' };
  });
  f.queue.update(snap('Offline change'));
  await f.advance(800);
  assert.equal(f.queue.state().status, 'offline');
  assert.equal(f.queue.isDirty(), true);
  await f.advance(10000);
  assert.equal(f.requests.length, 1);
  offline = false;
  assert.equal(await f.queue.retry(), true);
  assert.equal(f.queue.state().status, 'saved');
  assert.equal(f.requests[1].revision, 'r0');
});
test('validation/server failures keep edits and do not retry endlessly without another edit or manual retry', async () => {
  let fail = true;
  const f = fixture(async () => {
    if (fail) throw Object.assign(new Error('Invalid document'), { status: 'invalid' });
    return { id: 'card', revision: 'r1' };
  });
  f.queue.update(snap('Invalid change'));
  await f.advance(800);
  assert.equal(f.queue.state().status, 'invalid');
  assert(f.queue.isDirty());
  await f.advance(10000);
  assert.equal(f.requests.length, 1);
  fail = false;
  f.queue.update(snap('Corrected'));
  await f.advance(800);
  assert.equal(f.queue.state().status, 'saved');
});
test('revision conflicts stop automatic and manual writes until the saved version is explicitly reloaded', async () => {
  const f = fixture(async () => {
    throw Object.assign(new Error('Changed elsewhere'), { status: 'conflict' });
  });
  f.queue.update(snap('Local'));
  await f.advance(800);
  assert.equal(f.queue.state().status, 'conflict');
  f.queue.update(snap('More typing'));
  await f.advance(1000);
  assert.equal(await f.queue.flush(), false);
  assert.equal(await f.queue.retry(), false);
  assert.equal(f.requests.length, 1);
  assert(f.queue.isDirty());
  f.queue.reset(snap('Remote'), 'r9', true);
  assert.equal(f.queue.isDirty(), false);
  assert.equal(f.queue.state().status, 'saved');
});
test('responses from a previous owner/session cannot mark the next session saved', async () => {
  let resolve;
  let callbacks = 0;
  const states = [];
  const q = createSaveQueue({
    send: () => new Promise((r) => (resolve = r)),
    onState: (s) => states.push(s),
    onSaved: () => callbacks++,
  });
  q.reset(snap('Owner one'), 'r0', true);
  q.update(snap('Owner one edit'));
  const old = q.flush();
  q.stop();
  q.reset(snap('Owner two'), 'other', true);
  resolve({ id: 'old-card', revision: 'old-r1' });
  await old;
  assert.equal(callbacks, 0);
  assert.equal(q.isDirty(), false);
  assert.equal(q.state().status, 'saved');
  q.stop();
});

test('manual saving can create a prefilled first card without causing a write on initial hydration', async () => {
  const f = fixture();
  f.queue.reset(snap('Prefilled first card'), null, false);
  await f.queue.retry();
  await f.queue.flush(false);
  await f.advance(1000);
  assert.equal(f.requests.length, 0);
  assert.equal(await f.queue.flush(), true);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].revision, null);
  assert.equal(f.queue.state().status, 'saved');
});
