import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="btn-secondary !p-2 disabled:opacity-40">
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-ink-600 px-2">
        Page <span className="font-semibold text-ink-900">{page}</span> of {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="btn-secondary !p-2 disabled:opacity-40">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
