import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  // Reset to page 1 when items change length significantly
  const reset = () => setPage(1);

  return { paged, page: safePage, totalPages, setPage, reset, total: items.length };
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  language?: string;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, language = 'fr' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btn = (label: React.ReactNode, target: number, disabled: boolean, active = false) => (
    <button
      key={String(label)}
      onClick={() => !disabled && onPageChange(target)}
      disabled={disabled}
      style={{
        minWidth: '32px', height: '32px', padding: '0 0.4rem',
        border: '1px solid var(--neutral-border)',
        background: active ? 'var(--primary)' : disabled ? 'var(--neutral-light)' : 'white',
        color: active ? 'white' : disabled ? '#bbb' : 'var(--primary)',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'default' : 'pointer',
        fontWeight: active ? 700 : 500,
        fontSize: '0.8rem',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'gray' }}>
        {language === 'ar'
          ? `${from}–${to} من ${total}`
          : `${from}–${to} sur ${total}`}
      </span>
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {btn('‹', page - 1, page === 1)}
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} style={{ padding: '0 0.25rem', lineHeight: '32px', color: 'gray' }}>…</span>
            : btn(p, p as number, false, p === page)
        )}
        {btn('›', page + 1, page === totalPages)}
      </div>
    </div>
  );
}
