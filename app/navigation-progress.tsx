'use client';
import { useEffect, useState } from 'react';
import RouteLoading from './route-loading';

export function isPageNavigation(href: string, current: string) {
  const next = new URL(href, current);
  const previous = new URL(current);
  return (
    next.origin === previous.origin &&
    ['http:', 'https:'].includes(next.protocol) &&
    !(
      next.pathname === previous.pathname &&
      next.search === previous.search &&
      (next.hash || previous.hash)
    )
  );
}

export default function NavigationProgress() {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const reset = () => setPending(false);
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute('download') ||
        (anchor.target && !['_self', '_top'].includes(anchor.target))
      )
        return;
      if (isPageNavigation(anchor.href, location.href)) setPending(true);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') reset();
    };
    document.addEventListener('click', click);
    document.addEventListener('keydown', key);
    window.addEventListener('pageshow', reset);
    return () => {
      document.removeEventListener('click', click);
      document.removeEventListener('keydown', key);
      window.removeEventListener('pageshow', reset);
    };
  }, []);
  return pending ? <RouteLoading overlay /> : null;
}
