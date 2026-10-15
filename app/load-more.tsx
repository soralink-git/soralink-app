'use client';
import type { PageInfo } from './lib/pagination';

export default function LoadMore({
  page,
  busy,
  ar,
  onClick,
}: {
  page?: PageInfo;
  busy: boolean;
  ar: boolean;
  onClick: () => void;
}) {
  if (!page?.nextCursor) return null;
  return (
    <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
      <button className="secondary" type="button" disabled={busy} onClick={onClick}>
        {busy ? (ar ? 'كنحمّلو…' : 'Chargement…') : ar ? 'بيّن المزيد' : 'Afficher plus'}
      </button>
    </div>
  );
}
