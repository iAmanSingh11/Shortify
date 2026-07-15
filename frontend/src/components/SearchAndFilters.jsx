import { Search, ArrowUpDown } from 'lucide-react';

const SearchAndFilters = ({ filters, setFilters }) => {
  const update = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Search by title, URL, or short code..."
          className="input pl-10"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
        />
      </div>

      <select className="input sm:w-40" value={filters.status} onChange={(e) => update('status', e.target.value)}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="expired">Expired</option>
      </select>

      <div className="relative sm:w-52">
        <ArrowUpDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <select
          className="input pl-9"
          value={`${filters.sortBy}:${filters.order}`}
          onChange={(e) => {
            const [sortBy, order] = e.target.value.split(':');
            setFilters((f) => ({ ...f, sortBy, order, page: 1 }));
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="totalClicks:desc">Most clicks</option>
          <option value="totalClicks:asc">Fewest clicks</option>
          <option value="title:asc">Title A-Z</option>
        </select>
      </div>
    </div>
  );
};

export default SearchAndFilters;
