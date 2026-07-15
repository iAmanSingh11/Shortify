import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, QrCode, MousePointerClick, Globe2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import Loader from '../components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import QRModal from '../components/QRModal.jsx';
import ClicksOverTimeChart from '../components/charts/ClicksOverTimeChart.jsx';
import BreakdownDonutChart from '../components/charts/BreakdownDonutChart.jsx';
import BarBreakdownChart from '../components/charts/BarBreakdownChart.jsx';
import { fetchUrlById } from '../api/url.api.js';
import { fetchUrlAnalytics } from '../api/analytics.api.js';

const RANGES = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
];

const LinkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [linkRes, analyticsRes] = await Promise.all([fetchUrlById(id), fetchUrlAnalytics(id, range)]);
      setLink(linkRes.data.data.url);
      setAnalytics(analyticsRes.data.data);
    } catch {
      toast.error('Failed to load link analytics');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, range, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !link) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Navbar />
        <div className="py-24 flex justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost !px-2">
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink-900 truncate">{link.title || link.shortCode}</h1>
            <p className="text-brand-600 font-medium text-sm mt-1">{link.shortUrl}</p>
            <p className="text-ink-500 text-sm truncate mt-0.5">{link.originalUrl}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleCopy} className="btn-secondary">
              <Copy size={15} /> Copy
            </button>
            <button onClick={() => setQrOpen(true)} className="btn-secondary">
              <QrCode size={15} /> QR Code
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r.value ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Total clicks (all-time)" value={link.totalClicks?.toLocaleString() ?? 0} icon={MousePointerClick} accent="brand" />
          <StatCard label={`Clicks in range`} value={analytics.totalClicksInRange?.toLocaleString() ?? 0} icon={Globe2} accent="green" />
          <StatCard label="Top device" value={analytics.byDevice?.[0]?.name ?? 'N/A'} icon={Smartphone} accent="amber" />
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Clicks over time</h2>
          <ClicksOverTimeChart data={analytics.clicksOverTime} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Devices</h2>
            <BreakdownDonutChart data={analytics.byDevice} />
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Browsers</h2>
            <BreakdownDonutChart data={analytics.byBrowser} />
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Operating systems</h2>
            <BarBreakdownChart data={analytics.byOs} />
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Top countries</h2>
            <BarBreakdownChart data={analytics.byCountry} />
          </div>
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-semibold text-ink-900 mb-4">Top referrers</h2>
            <BarBreakdownChart data={analytics.byReferrer} />
          </div>
        </div>
      </main>

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} urlId={link._id} shortCode={link.shortCode} />
    </div>
  );
};

export default LinkDetailPage;
