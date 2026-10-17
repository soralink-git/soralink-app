'use client';
import { useEffect, useRef, useState } from 'react';
import {
  createSaveQueue,
  type CardSnapshot,
  type SaveResult,
  type SaveState,
} from './lib/save-queue';
export default function useCardAutosave({
  data,
  published,
  ar,
  enabled,
  paused,
  onSaved,
}: {
  data: any;
  published: boolean;
  ar: boolean;
  enabled: boolean;
  paused: boolean;
  onSaved: (result: SaveResult) => void;
}) {
  const [state, setState] = useState<SaveState>({ status: 'ready', dirty: false });
  const callback = useRef(onSaved);
  callback.current = onSaved;
  const language = useRef(ar);
  language.current = ar;
  const ownerRef = useRef<string | null>(null);
  const active = useRef(enabled);
  const wasActive = useRef(enabled);
  active.current = enabled;
  const queueRef = useRef<ReturnType<typeof createSaveQueue> | null>(null);
  if (!queueRef.current)
    queueRef.current = createSaveQueue({
      onState: setState,
      onSaved: (result) => callback.current(result),
      send: async (snapshot, revision) => {
        const expectedOwner = ownerRef.current;
        if (!expectedOwner)
          throw Object.assign(
            new Error(
              language.current
                ? 'عاود حمّل الحساب قبل التسجيل.'
                : 'Rechargez votre compte avant d’enregistrer.',
            ),
            { status: 'conflict' },
          );
        if (!navigator.onLine)
          throw Object.assign(
            new Error(
              language.current
                ? 'ما كاينش الاتصال. التغييرات ما تسجلاتش.'
                : 'Hors ligne. Les modifications ne sont pas encore enregistrées.',
            ),
            { status: 'offline' },
          );
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', ...snapshot, revision, expectedOwner }),
            signal: controller.signal,
          });
          const result = (await response.json()) as any;
          if (!response.ok)
            throw Object.assign(
              new Error(
                language.current
                  ? result.errorAr || 'ما قدرناش نسجّلو التغييرات.'
                  : result.error || 'Enregistrement impossible.',
              ),
              {
                status:
                  response.status === 409
                    ? 'conflict'
                    : response.status === 400
                      ? 'invalid'
                      : 'error',
              },
            );
          return result;
        } catch (error: any) {
          if (error.status) throw error;
          throw Object.assign(
            new Error(
              language.current
                ? 'تعذر التسجيل. تحقق من الاتصال وعاود جرّب.'
                : 'Connexion interrompue. Vérifiez votre connexion puis réessayez.',
            ),
            { status: navigator.onLine ? 'error' : 'offline' },
          );
        } finally {
          clearTimeout(timeout);
        }
      },
    });
  const queue = queueRef.current;
  const latest = useRef<CardSnapshot>({ data, published });
  latest.current = { data: { ...data, defaultLanguage: ar ? 'ar' : 'fr' }, published };
  useEffect(() => {
    if (enabled) queue.update(latest.current);
    const leaving = wasActive.current && !enabled;
    wasActive.current = enabled;
    if (leaving && !paused && queue.isDirty()) {
      queue.pause(false);
      void queue.flush().finally(() => {
        if (!active.current) queue.pause(true);
      });
    } else queue.pause(!enabled || paused);
  }, [queue, data, published, ar, enabled, paused]);
  useEffect(() => {
    const online = () => {
      if (enabled && !paused) {
        queue.update(latest.current);
        void queue.retry();
      }
    };
    const hidden = () => {
      if (document.visibilityState === 'hidden' && enabled && !paused) {
        queue.update(latest.current);
        void queue.flush(false);
      }
    };
    const leave = (event: BeforeUnloadEvent) => {
      if (enabled) queue.update(latest.current);
      if (queue.isReady() && queue.isDirty()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('beforeunload', leave);
    return () => {
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('beforeunload', leave);
    };
  }, [queue, enabled, paused]);
  useEffect(() => () => queue.pause(true), [queue]);
  return { queue, state, latest, ownerRef };
}
