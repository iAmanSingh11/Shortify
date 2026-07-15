import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { verifyLinkPassword } from '../api/url.api.js';

const ProtectedLinkPage = () => {
  const { shortCode } = useParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await verifyLinkPassword(shortCode, password);
      window.location.href = data.data.originalUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="card p-7 text-center animate-slide-up">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
            <Lock size={22} />
          </div>
          <h1 className="text-lg font-bold text-ink-900">This link is password protected</h1>
          <p className="text-sm text-ink-500 mt-1 mb-6">Enter the password to continue to your destination</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <input
              type="password"
              autoFocus
              placeholder="Enter password"
              className="input text-center"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p className="flex items-center justify-center gap-1.5 text-sm text-red-600">
                <ShieldAlert size={14} /> {error}
              </p>
            )}
            <button type="submit" disabled={loading || !password} className="btn-primary w-full !py-3">
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProtectedLinkPage;
