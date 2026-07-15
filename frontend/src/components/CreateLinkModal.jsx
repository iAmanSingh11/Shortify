import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Link2, Lock, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { createShortUrl } from '../api/url.api.js';

const CreateLinkModal = ({ open, onClose, onCreated }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  if (!open) return null;

  const onSubmit = async (values) => {
    try {
      const payload = {
        originalUrl: values.originalUrl.trim(),
        customAlias: values.customAlias?.trim() || undefined,
        title: values.title?.trim() || undefined,
        password: values.password?.trim() || undefined,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      };
      const { data } = await createShortUrl(payload);
      toast.success('Short link created!');
      reset();
      setShowAdvanced(false);
      onCreated?.(data.data.url);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink-900">Create a short link</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Destination URL</label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="https://example.com/my-long-url"
                className="input pl-10"
                {...register('originalUrl', { required: 'A destination URL is required' })}
              />
            </div>
            {errors.originalUrl && <p className="error-text">{errors.originalUrl.message}</p>}
          </div>

          <div>
            <label className="label">Title (optional)</label>
            <input type="text" placeholder="My awesome link" className="input" {...register('title')} />
          </div>

          <div>
            <label className="label">Custom alias (optional)</label>
            <div className="flex items-center rounded-xl border border-ink-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
              <span className="px-3 text-sm text-ink-400 bg-ink-50 h-full py-2.5 border-r border-ink-200">shortify.link/</span>
              <input type="text" placeholder="my-brand" className="flex-1 px-3 py-2.5 text-sm outline-none" {...register('customAlias')} />
            </div>
          </div>

          <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
            {showAdvanced ? '- Hide advanced options' : '+ Add password, expiry & tags'}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-1 border-t border-ink-100">
              <div>
                <label className="label flex items-center gap-1.5"><Lock size={14} /> Password protection</label>
                <input type="text" placeholder="Leave blank for no password" className="input" {...register('password')} />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Calendar size={14} /> Expiration date</label>
                <input type="datetime-local" className="input" {...register('expiresAt')} />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Tag size={14} /> Tags (comma separated)</label>
                <input type="text" placeholder="marketing, campaign-q3" className="input" {...register('tags')} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Creating...' : 'Create link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLinkModal;
