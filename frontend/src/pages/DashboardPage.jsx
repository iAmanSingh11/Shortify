import { useEffect, useState, useCallback } from 'react';
import { Plus, Link2, MousePointerClick, TrendingUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import StatCard from '../components/StatCard.jsx';
import LinkTable from '../components/LinkTable.jsx';
import SearchAndFilters from '../components/SearchAndFilters.jsx';
import Pagination from '../components/Pagination.jsx';
import CreateLinkModal from '../components/CreateLinkModal.jsx';
import ClicksOverTimeChart from '../components/charts/ClicksOverTimeChart.jsx';
import Loader from '../components/Loader.jsx';
import { fetchUserUrls } from '../api/url.api.js';
import { fetchDashboardOverview } from '../api/analytics.api.js';

const DashboardPage = () => {
  const [links, setLinks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: 'all', sortBy: 'createdAt', order: 'desc', page: 1 });

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchUserUrls({ ...filters, limit: 10 });
      setLinks(data.data.urls);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load your links');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadOverview = useCallback(async () => {
    try {
      const { data } = await fetchDashboardOverview();
      setOverview(data.data);
    } catch {
      // non blocking
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const refreshAll = () => {
    loadLinks();
    loadOverview();
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 font-display">Dashboard</h1>
            <p className="text-sm text-ink-500 mt-0.5">Manage your links and track performance</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={17} /> Create link
          </button>
        </div>

        {overview && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total links" value={overview.totalLinks?.toLocaleString() ?? 0} icon={Link2} accent="brand" />
              <StatCard label="Total clicks" value={overview.totalClicks?.toLocaleString() ?? 0} icon={MousePointerClick} accent="green" />
              <StatCard label="Active links" value={overview.activeLinks?.toLocaleString() ?? 0} icon={CheckCircle2} accent="amber" />
              <StatCard
                label="Avg. clicks / link"
                value={overview.totalLinks ? Math.round(overview.totalClicks / overview.totalLinks) : 0}
                icon={TrendingUp}
                accent="rose"
              />
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-ink-900 mb-4">Clicks — last 14 days</h2>
              <ClicksOverTimeChart data={overview.clicksLast14Days} />
            </div>
          </>
        )}

        <div className="space-y-4">
          <SearchAndFilters filters={filters} setFilters={setFilters} />
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader />
            </div>
          ) : (
            <>
              <LinkTable links={links} onChange={refreshAll} />
              <Pagination page={meta.page} totalPages={meta.totalPages} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
            </>
          )}
        </div>
      </main>

      <CreateLinkModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refreshAll} />
    </div>
  );
};

export default DashboardPage;
