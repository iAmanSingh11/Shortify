import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchQrCode } from '../api/url.api.js';
import Loader from './Loader.jsx';

const QRModal = ({ open, onClose, urlId, shortCode }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !urlId) return;
    setLoading(true);
    fetchQrCode(urlId)
      .then(({ data }) => setQrCode(data.data.qrCode))
      .catch(() => toast.error('Failed to generate QR code'))
      .finally(() => setLoading(false));
  }, [open, urlId]);

  if (!open) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${shortCode}-qrcode.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-sm p-6 animate-slide-up text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-900">QR Code</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center min-h-[240px]">
          {loading ? <Loader /> : qrCode ? <img src={qrCode} alt="QR Code" className="rounded-xl border border-ink-100" /> : null}
        </div>

        <button onClick={handleDownload} disabled={!qrCode} className="btn-primary w-full mt-4">
          <Download size={16} /> Download PNG
        </button>
      </div>
    </div>
  );
};

export default QRModal;
