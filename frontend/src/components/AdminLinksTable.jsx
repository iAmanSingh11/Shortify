import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Trash2, ExternalLink } from 'lucide-react';
import { deleteAdminLink } from '../api/admin.api.js';

const AdminLinksTable = ({ links, onChange }) => {
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this link permanently?')) return;
    try {
      await deleteAdminLink(id);
      toast.success('Link deleted');
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete link');
    }
  };

  if (links.length === 0) {
    return <div className="card p-10 text-center text-ink-500">No links found</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-5 py-3">Link</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Clicks</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {links.map((l) => (
              <tr key={l._id} className="hover:bg-ink-50/50 transition-colors">
                <td className="px-5 py-3.5 max-w-sm">
                  <p className="font-semibold text-brand-600 truncate">{l.title || l.shortCode}</p>
                  <p className="text-xs text-ink-500 truncate">{l.shortUrl}</p>
                  <p className="text-xs text-ink-400 truncate">{l.originalUrl}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-ink-800">{l.user?.name ?? 'Deleted user'}</p>
                  <p className="text-xs text-ink-500">{l.user?.email}</p>
                </td>
                <td className="px-5 py-3.5 font-semibold text-ink-800">{l.totalClicks?.toLocaleString() ?? 0}</td>
                <td className="px-5 py-3.5 text-ink-500">{format(new Date(l.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <a href={l.originalUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-ink-500 hover:bg-ink-100">
                      <ExternalLink size={15} />
                    </a>
                    <button onClick={() => handleDelete(l._id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLinksTable;
