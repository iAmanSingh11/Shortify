import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { KeyRound, Copy, Trash2, Plus, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navbar from '../components/Navbar.jsx';
import Loader from '../components/Loader.jsx';
import { fetchApiKeys, createApiKey, revokeApiKey } from '../api/apiKey.api.js';

const SCOPES = ['urls:read', 'urls:write', 'analytics:read'];

const ApiKeysPage = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRawKey, setNewRawKey] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: '', scopes: SCOPES, expiresInDays: '' },
  });

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchApiKeys();
      setKeys(data.data.apiKeys);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name,
        scopes: Array.isArray(values.scopes) ? values.scopes : [values.scopes].filter(Boolean),
        expiresInDays: values.expiresInDays ? Number(values.expiresInDays) : undefined,
      };
      const { data } = await createApiKey(payload);
      setNewRawKey(data.data.rawKey);
      reset();
      loadKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create API key');
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this API key? Any integration using it will stop working immediately.')) return;
    try {
      await revokeApiKey(id);
      toast.success('API key revoked');
      loadKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke key');
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newRawKey);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 font-display flex items-center gap-2">
              <KeyRound className="text-brand-600" size={22} /> API keys
            </h1>
            <p className="text-sm text-ink-500 mt-0.5">
              Authenticate programmatic requests by sending <code className="bg-ink-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> header. See{' '}
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api-docs`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                API docs
              </a>.
            </p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={17} /> New API key
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader /></div>
        ) : keys.length === 0 ? (
          <div className="card p-12 text-center text-ink-500">
            <p className="font-medium">No API keys yet</p>
            <p className="text-sm mt-1">Create one to authenticate requests from scripts or external services.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Key</th>
                  <th className="px-5 py-3">Scopes</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {keys.map((k) => (
                  <tr key={k._id} className="hover:bg-ink-50/50">
                    <td className="px-5 py-3.5 font-semibold text-ink-900">{k.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-ink-500">{k.keyPrefix}••••••••••••</td>
                    <td className="px-5 py-3.5 text-xs text-ink-500">{k.scopes?.join(', ')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${k.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-100 text-ink-500'}`}>
                        {k.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">{format(new Date(k.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-3.5 text-right">
                      {k.isActive && (
                        <button onClick={() => handleRevoke(k._id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink-900">Create API key</h2>
              <button onClick={() => { setCreateOpen(false); setNewRawKey(null); }} className="text-ink-400 hover:text-ink-700">
                <X size={20} />
              </button>
            </div>

            {newRawKey ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 bg-amber-50 text-amber-700 rounded-xl p-3 text-sm">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <p>This is the only time you'll see the full key. Copy it now and store it somewhere safe.</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-ink-50 border border-ink-200 rounded-xl px-3 py-2.5 text-xs break-all">{newRawKey}</code>
                  <button onClick={copyKey} className="btn-secondary !p-2.5"><Copy size={16} /></button>
                </div>
                <button onClick={() => { setCreateOpen(false); setNewRawKey(null); }} className="btn-primary w-full">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Key name</label>
                  <input className="input" placeholder="e.g. CI deploy script" {...register('name', { required: true })} />
                </div>
                <div>
                  <label className="label">Scopes</label>
                  <div className="space-y-2">
                    {SCOPES.map((scope) => (
                      <label key={scope} className="flex items-center gap-2 text-sm text-ink-700">
                        <input type="checkbox" value={scope} defaultChecked className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" {...register('scopes')} />
                        {scope}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Expires in (days, optional)</label>
                  <input type="number" min="1" className="input" placeholder="Leave blank for no expiry" {...register('expiresInDays')} />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? 'Creating...' : 'Create key'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
