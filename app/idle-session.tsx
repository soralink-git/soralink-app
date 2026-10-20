'use client';
import { useEffect } from 'react';
import { ACTIVITY_SYNC_MS, sessionIsActive } from './lib/idle-policy';
export default function IdleSession() {
  useEffect(() => {
    let disposed = false,
      expiresAt = 0,
      pending = false,
      syncing = false,
      checking = false,
      nextSync = 0,
      ending = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const privatePage = () =>
      location.pathname === '/admin' ||
      location.pathname.startsWith('/auth/reset') ||
      new URLSearchParams(location.search).has('app') ||
      new URLSearchParams(location.search).has('tab');
    function end() {
      if (disposed || ending) return;
      ending = true;
      expiresAt = 0;
      // The server already denies expired sessions, even when this request cannot complete.
      void fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
        keepalive: true,
      }).catch(() => {});
      if (privatePage()) {
        const ar = document.documentElement.lang === 'ar';
        const path = location.pathname.startsWith('/admin') ? '/admin/connexion' : '/auth';
        location.replace(path + '?expired=1&lang=' + (ar ? 'ar' : 'fr'));
      } else location.reload();
    }
    async function check(initial = false) {
      if (disposed || checking || ending) return;
      checking = true;
      try {
        const r = await fetch('/api/auth', { cache: 'no-store' });
        if (!r.ok) {
          if (expiresAt && !sessionIsActive(expiresAt)) end();
          return;
        }
        const b = (await r.json()) as { authenticated?: boolean; expiresAt: number };
        if (disposed || ending) return;
        if (b.authenticated && sessionIsActive(b.expiresAt)) expiresAt = b.expiresAt;
        else if (!initial && expiresAt) end();
      } catch {
        // A sleeping/offline phone must still hide the expired dashboard.
        if (expiresAt && !sessionIsActive(expiresAt)) end();
      } finally {
        checking = false;
      }
    }
    async function sync() {
      if (
        disposed ||
        syncing ||
        ending ||
        !pending ||
        !expiresAt ||
        document.visibilityState !== 'visible'
      )
        return;
      if (!sessionIsActive(expiresAt)) {
        void check();
        return;
      }
      syncing = true;
      pending = false;
      nextSync = Date.now() + ACTIVITY_SYNC_MS;
      try {
        const r = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'activity' }),
        });
        if (disposed || ending) return;
        if (r.status === 401) {
          end();
          return;
        }
        if (r.ok) {
          const b = (await r.json()) as { expiresAt: number };
          if (sessionIsActive(b.expiresAt)) expiresAt = b.expiresAt;
        }
      } catch {
      } finally {
        syncing = false;
      }
    }
    function activity(event: Event) {
      if (!event.isTrusted || !expiresAt || ending || document.visibilityState !== 'visible')
        return;
      if (!sessionIsActive(expiresAt)) {
        void check();
        return;
      }
      pending = true;
      if (Date.now() >= nextSync) void sync();
      else if (!timer)
        timer = setTimeout(() => {
          timer = undefined;
          void sync();
        }, nextSync - Date.now());
    }
    function resume() {
      if (document.visibilityState === 'visible') void check();
    }
    const events = ['pointerdown', 'keydown', 'input', 'scroll'] as const;
    events.forEach((name) =>
      document.addEventListener(name, activity, { passive: true, capture: true }),
    );
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    const clock = setInterval(() => {
      if (expiresAt && !sessionIsActive(expiresAt)) void check();
    }, 1000);
    void check(true);
    return () => {
      disposed = true;
      clearInterval(clock);
      if (timer) clearTimeout(timer);
      events.forEach((name) => document.removeEventListener(name, activity, true));
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume);
    };
  }, []);
  return null;
}
