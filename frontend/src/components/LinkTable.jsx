import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, QrCode, Pencil, Trash2, ExternalLink, Lock, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { deleteUrl } from '../api/url.api.js';
import QRModal from './QRModal.jsx';
import EditLinkModal from './EditLinkModal.jsx';

const LinkTable = ({ links, onChange }) => {
  const navigate = useNavigate();
  const [qrTarget, setQrTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const handleCopy = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    toast.success('Copied to clipboard');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this link permanently? This cannot be undone.')) return;
    try {
      await deleteUrl(id);
      toast.success('Link deleted');
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete link');
    }
  };

  const statusBadge = (link) => {
    const expired = link.expiresAt && new Date(link.expiresAt) < new Date();
    if (expired) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-ink-100 text-ink-500">Expired</span>;
    if (!link.isActive) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Inactive</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">Active</span>;
  };

  if (links.length === 0) {
    return (
      <div className="card p-12 text-center text-ink-500">
        <p className="font-medium">No links found</p>
        <p className="text-sm mt-1">Create your first short link to get started.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-5 py-3">Link</th>
              <th className="px-5 py-3">Clicks</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {links.map((link) => (
              <tr key={link._id} className="hover:bg-ink-50/50 transition-colors">
                <td className="px-5 py-3.5 max-w-sm">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => navigate(`/links/${link._id}`)} className="font-semibold text-brand-600 hover:underline truncate">
                      {link.title || link.shortCode}
                    </button>
                    {link.hasPassword && <Lock size={12} className="text-ink-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-ink-500 truncate">{link.shortUrl}</p>
                  <p className="text-xs text-ink-400 truncate">{link.originalUrl}</p>
                </td>
                <td className="px-5 py-3.5 font-semibold text-ink-800">{link.totalClicks?.toLocaleString() ?? 0}</td>
                <td className="px-5 py-3.5">{statusBadge(link)}</td>
                <td className="px-5 py-3.5 text-ink-500">{format(new Date(link.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button title="Copy" onClick={() => handleCopy(link.shortUrl)} className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                      <Copy size={15} />
                    </button>
                    <a title="Visit" href={link.originalUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                      <ExternalLink size={15} />
                    </a>
                    <button title="QR Code" onClick={() => setQrTarget(link)} className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                      <QrCode size={15} />
                    </button>
                    <button title="Analytics" onClick={() => navigate(`/links/${link._id}`)} className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                      <BarChart3 size={15} />
                    </button>
                    <button title="Edit" onClick={() => setEditTarget(link)} className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                      <Pencil size={15} />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(link._id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <QRModal open={Boolean(qrTarget)} onClose={() => setQrTarget(null)} urlId={qrTarget?._id} shortCode={qrTarget?.shortCode} />
      <EditLinkModal open={Boolean(editTarget)} onClose={() => setEditTarget(null)} link={editTarget} onUpdated={onChange} />
    </div>
  );
};

export default LinkTable;
