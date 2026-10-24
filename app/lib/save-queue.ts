import { profileName } from './profile-identity';
export type SaveStatus =
  | 'ready'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'invalid'
  | 'error'
  | 'offline'
  | 'conflict';
export type SaveState = { status: SaveStatus; dirty: boolean; error?: string; savedAt?: number };
export type CardSnapshot = { data: any; published: boolean };
export type SaveResult = { id: string; revision: string; cleanupPending?: boolean };
export function createSaveQueue(options: {
  send: (snapshot: CardSnapshot, revision: string | null) => Promise<SaveResult>;
  onState: (state: SaveState) => void;
  onSaved?: (result: SaveResult) => void;
  delay?: number;
  schedule?: (fn: () => void, delay: number) => any;
  cancel?: (timer: any) => void;
}) {
  let baseline: string | null = null,
    latest: string | null = null,
    revision: string | null = null,
    ready = false,
    persisted = false,
    paused = true,
    epoch = 0;
  let blocked: string | null = null,
    conflict = false,
    savedAt: number | undefined,
    timer: any = null,
    running: Promise<boolean> | null = null;
  let current: SaveState = { status: 'ready', dirty: false };
  const schedule = options.schedule || setTimeout,
    cancel = options.cancel || clearTimeout;
  const dirty = () => ready && latest !== baseline;
  function emit(status: SaveStatus, error?: string) {
    current = { status, dirty: dirty(), error, savedAt };
    options.onState(current);
  }
  function clear() {
    if (timer !== null) {
      cancel(timer);
      timer = null;
    }
  }
  function arm() {
    clear();
    if (!ready || paused || running || !dirty() || conflict || blocked === latest) return;
    timer = schedule(() => {
      timer = null;
      void flush(false);
    }, options.delay ?? 800);
  }
  function run() {
    if (running) return running;
    clear();
    const key = latest!,
      generation = epoch;
    running = (async () => {
      emit('saving');
      try {
        const result = await options.send(JSON.parse(key), revision);
        if (generation !== epoch) return false;
        revision = result.revision;
        persisted = true;
        baseline = key;
        blocked = null;
        savedAt = Date.now();
        options.onSaved?.(result);
        emit(dirty() ? 'pending' : 'saved');
        return true;
      } catch (error: any) {
        if (generation !== epoch) return false;
        blocked = key;
        conflict = error?.status === 'conflict';
        emit(
          ['invalid', 'offline', 'conflict'].includes(error?.status) ? error.status : 'error',
          error?.message || '',
        );
        return false;
      } finally {
        running = null;
        arm();
      }
    })();
    return running;
  }
  async function flush(force = true): Promise<boolean> {
    clear();
    if (!ready || paused || conflict) return false;
    if (running && !(await running)) return false;
    if (force && !persisted && !dirty() && profileName(JSON.parse(latest!).data)) baseline = null;
    while (dirty()) {
      if (paused || conflict || (!force && blocked === latest)) return false;
      const snapshot: CardSnapshot = JSON.parse(latest!);
      if (!profileName(snapshot.data)) {
        blocked = latest;
        emit('invalid');
        return false;
      }
      if (force) blocked = null;
      if (!(await run())) return false;
      if (!force) return !dirty();
    }
    return true;
  }
  return {
    reset(snapshot: CardSnapshot, rev: string | null, exists: boolean) {
      clear();
      epoch++;
      ready = true;
      persisted = exists;
      paused = false;
      baseline = latest = JSON.stringify(snapshot);
      revision = rev;
      blocked = null;
      conflict = false;
      savedAt = undefined;
      emit(exists ? 'saved' : 'ready');
    },
    update(snapshot: CardSnapshot) {
      const key = JSON.stringify(snapshot);
      if (!ready || key === latest) return;
      latest = key;
      if (conflict) {
        emit('conflict', current.error);
        return;
      }
      blocked = null;
      emit(running ? 'saving' : dirty() ? 'pending' : persisted ? 'saved' : 'ready');
      arm();
    },
    pause(value: boolean) {
      paused = value;
      if (value) clear();
      else arm();
    },
    flush,
    retry() {
      if (conflict) return Promise.resolve(false);
      if (!dirty()) return Promise.resolve(true);
      blocked = null;
      return flush();
    },
    isDirty: dirty,
    isReady: () => ready,
    state: () => current,
    stop() {
      clear();
      epoch++;
      ready = false;
      paused = true;
      baseline = latest;
      blocked = null;
      conflict = false;
      emit('ready');
    },
  };
}
