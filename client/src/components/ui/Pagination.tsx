import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export default function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift('...');
    if (page + delta < pages - 1) range.push('...');
    if (pages > 1) range.unshift(1);
    if (pages > 1) range.push(pages);
    return range;
  };

  if (pages <= 1 && total <= limit) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-3">
      <div className="flex items-center gap-4">
        <p className="text-sm text-white/50">
          Showing <span className="text-white font-medium">{start}</span> to{' '}
          <span className="text-white font-medium">{end}</span> of{' '}
          <span className="text-white font-medium">{total}</span> results
        </p>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            {[10, 20, 50, 100].map((l) => (
              <option key={l} value={l} className="bg-neutral-900">
                {l} per page
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={p === '...'}
            className={classNames(
              'w-9 h-9 rounded-lg text-sm font-medium transition-all',
              p === page
                ? 'bg-amber-600 text-white'
                : p === '...'
                ? 'text-white/30 cursor-default'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(pages)}
          disabled={page === pages}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
