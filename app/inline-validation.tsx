'use client';
import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fieldFeedback } from './lib/field-feedback';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Entry = {
  field: Field;
  host: HTMLElement;
  id: string;
  message: string;
  invalid: string | null;
};
// Progressive enhancement: native constraints and server validation remain authoritative.
// Only touched fields are announced; no focus changes or network requests on blur.
export default function InlineValidation() {
  const [entries, setEntries] = useState<Entry[]>([]);
  useEffect(() => {
    const touched = new WeakSet<Field>();
    const tracked = new Map<Field, Entry>();
    let sequence = 0;
    function restore(entry: Entry) {
      if (entry.field.getAttribute('aria-invalid') === 'true') {
        if (entry.invalid === null) entry.field.removeAttribute('aria-invalid');
        else entry.field.setAttribute('aria-invalid', entry.invalid);
      }
      const descriptions = (entry.field.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== entry.id);
      if (descriptions.length) entry.field.setAttribute('aria-describedby', descriptions.join(' '));
      else entry.field.removeAttribute('aria-describedby');
    }
    function inspect(event: Event) {
      const field = event.target;
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
      )
        return;
      if (
        !field.closest('form') ||
        !field.willValidate ||
        field.disabled ||
        (field instanceof HTMLInputElement &&
          ['checkbox', 'radio', 'file', 'range', 'color', 'hidden'].includes(field.type))
      )
        return;
      const host = field.closest<HTMLElement>('.field') || field.closest('label');
      if (!host) return;
      if (event.type === 'focusout') touched.add(field);
      if (!touched.has(field)) return;
      const password = field.form?.elements.namedItem('password');
      const confirmationMatches =
        field.name !== 'confirm' ||
        !(password instanceof HTMLInputElement) ||
        field.value === password.value;
      const message = fieldFeedback(
        field,
        document.documentElement.lang === 'ar',
        confirmationMatches,
      );
      let entry = tracked.get(field);
      if (!message) {
        if (entry) {
          restore(entry);
          tracked.delete(field);
        }
      } else {
        if (!entry)
          entry = {
            field,
            host,
            id: `field-feedback-${++sequence}`,
            message,
            invalid: field.getAttribute('aria-invalid'),
          };
        entry.message = message;
        tracked.set(field, entry);
        field.setAttribute('aria-invalid', 'true');
        const ids = new Set(
          (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean),
        );
        ids.add(entry.id);
        field.setAttribute('aria-describedby', [...ids].join(' '));
      }
      setEntries([...tracked.values()].filter((item) => item.field.isConnected));
    }
    function reset(event: Event) {
      for (const [field, entry] of tracked) {
        if ((event.target as HTMLElement).contains(field)) {
          restore(entry);
          tracked.delete(field);
          touched.delete(field);
        }
      }
      setEntries([...tracked.values()]);
    }
    const observer = new MutationObserver(() => {
      let removed = false;
      for (const [field] of tracked)
        if (!field.isConnected) {
          tracked.delete(field);
          touched.delete(field);
          removed = true;
        }
      if (removed) setEntries([...tracked.values()]);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('focusout', inspect);
    document.addEventListener('input', inspect);
    document.addEventListener('change', inspect);
    document.addEventListener('reset', reset);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusout', inspect);
      document.removeEventListener('input', inspect);
      document.removeEventListener('change', inspect);
      document.removeEventListener('reset', reset);
      for (const entry of tracked.values()) restore(entry);
    };
  }, []);
  return entries.map((entry) => (
    <Fragment key={entry.id}>
      {createPortal(
        <span id={entry.id} className="inline-field-error" aria-hidden="true">
          {entry.message}
        </span>,
        entry.host,
        entry.id,
      )}
      <span className="sr-only" role="status">
        {entry.message}
      </span>
    </Fragment>
  ));
}
