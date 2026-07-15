import { useCallback, useEffect, useState } from 'react';
import { Users, Link2, MousePointerClick, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import StatCard from '../components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import AdminUsersTable from '../components/AdminUsersTable.jsx';
import AdminLinksTable from '../components/AdminLinksTable.jsx';
import AuditLogTable from '../components/AuditLogTable.jsx';
import ClicksOverTimeChart from '../components/charts/ClicksOverTimeChart.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAdminOverview, fetchAdminUsers, fetchAdminLinks, fetchAuditLogs } from '../api/admin.api.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'links', label: 'Links' },
  { id: 'audit', label: 'Audit log' },
];

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState({ page: 1, totalPages: 1 });
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [links, setLinks] = useState([]);
  const [linksMeta, setLinksMeta] = useState({ page: 1, totalPages: 1 });
  const [linksSearch, setLinksSearch] = useState('');
  const [loadingLinks, setLoadingLinks] = useState(false);

  const [logs, setLogs] = useState([]);
  const [logsMeta, setLogsMeta] = useState({ page: 1, totalPages: 1 });
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const { data } = await fetchAdminOverview();
      setOverview(data.data);
    } catch {
      toast.error('Failed to load admin overview');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    setLoadingUsers(true);
    try {
      const { data } = await fetchAdminUsers({ search: usersSearch, page, limit: 10 });
      setUsers(data.data.users);
      setUsersMeta(data.meta);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
    // eslint disable next line react hooks
  }, [usersSearch]);

  const loadLinks = useCallback(async (page = 1) => {
    setLoadingLinks(true);
    try {
      const { data } = await fetchAdminLinks({ search: linksSearch, page, limit: 10 });
      setLinks(data.data.links);
      setLinksMeta(data.meta);
    } catch {
      toast.error('Failed to load links');
    } finally {
      setLoadingLinks(false);
    }
   
  }, [linksSearch]);

  const loadLogs = useCallback(async (page = 1) => {
    setLoadingLogs(true);
    try {
      const { data } = await fetchAuditLogs({ page, limit: 15 });
      setLogs(data.data.logs);
      setLogsMeta(data.meta);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === 'users') loadUsers(1);
    if (tab === 'links') loadLinks(1);
    if (tab === 'audit') loadLogs(1);
    // eslint disable next line react hooks
  }, [tab, usersSearch, linksSearch]);

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 font-display flex items-center gap-2">
            <ShieldCheck className="text-brand-600" size={24} /> Admin dashboard
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">Platform-wide user, link, and security oversight</p>
        </div>

        <div className="flex gap-1 border-b border-ink-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' &&
          (loadingOverview ? (
            <div className="py-16 flex justify-center"><Loader /></div>
          ) : overview ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total users" value={overview.totalUsers?.toLocaleString() ?? 0} icon={Users} accent="brand" />
                <StatCard label="Total links" value={overview.totalLinks?.toLocaleString() ?? 0} icon={Link2} accent="green" />
                <StatCard label="Total clicks" value={overview.totalClicks?.toLocaleString() ?? 0} icon={MousePointerClick} accent="amber" />
                <StatCard label="Clicks today" value={overview.clicksToday?.toLocaleString() ?? 0} icon={MousePointerClick} accent="rose" />
              </div>
              <div className="card p-6">
                <h2 className="font-semibold text-ink-900 mb-4">Platform clicks — last 7 days</h2>
                <ClicksOverTimeChart data={overview.clicksLast7Days} />
              </div>
            </div>
          ) : null)}

        {tab === 'users' && (
          <div className="space-y-4">
            <input
              className="input max-w-sm"
              placeholder="Search by name or email..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
            />
            {loadingUsers ? (
              <div className="py-16 flex justify-center"><Loader /></div>
            ) : (
              <>
                <AdminUsersTable users={users} onChange={() => loadUsers(usersMeta.page)} currentUserId={user?.id} />
                <Pagination page={usersMeta.page} totalPages={usersMeta.totalPages} onChange={loadUsers} />
              </>
            )}
          </div>
        )}

        {tab === 'links' && (
          <div className="space-y-4">
            <input
              className="input max-w-sm"
              placeholder="Search by title, URL, or short code..."
              value={linksSearch}
              onChange={(e) => setLinksSearch(e.target.value)}
            />
            {loadingLinks ? (
              <div className="py-16 flex justify-center"><Loader /></div>
            ) : (
              <>
                <AdminLinksTable links={links} onChange={() => loadLinks(linksMeta.page)} />
                <Pagination page={linksMeta.page} totalPages={linksMeta.totalPages} onChange={loadLinks} />
              </>
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div className="space-y-4">
            {loadingLogs ? (
              <div className="py-16 flex justify-center"><Loader /></div>
            ) : (
              <>
                <AuditLogTable logs={logs} />
                <Pagination page={logsMeta.page} totalPages={logsMeta.totalPages} onChange={loadLogs} />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
