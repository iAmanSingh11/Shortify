import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateUrl } from '../api/url.api.js';

const EditLinkModal = ({ open, onClose, link, onUpdated }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (link) {
      reset({
        title: link.title ,
        originalUrl: link.originalUrl,
        isActive: link.isActive,
        expiresAt: link.expiresAt ? link.expiresAt.slice(0, 16) : '',
      });
    }
  }, [link, reset]);

  if (!open || !link) return null;

  const onSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        originalUrl: values.originalUrl,
        isActive: values.isActive,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      };
      const { data } = await updateUrl(link._id, payload);
      toast.success('Link updated');
      onUpdated?.(data.data.url);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink-900">Edit link</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" {...register('title')} />
          </div>
          <div>
            <label className="label">Destination URL</label>
            <input className="input" {...register('originalUrl', { required: true })} />
          </div>
          <div>
            <label className="label">Expiration date</label>
            <input type="datetime-local" className="input" {...register('expiresAt')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" {...register('isActive')} />
            Link is active
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLinkModal;
