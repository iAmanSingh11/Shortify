import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, BarChart3, ShieldCheck, Zap, QrCode, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  { icon: Zap, title: 'Blazing-fast redirects', desc: 'Redis-cached lookups keep redirect latency near-zero, even under heavy traffic.' },
  { icon: BarChart3, title: 'Deep analytics', desc: 'Track clicks by device, browser, OS, country and referrer with interactive charts.' },
  { icon: ShieldCheck, title: 'Secure by design', desc: 'JWT auth, bcrypt hashing, rate limiting, and optional password-protected links.' },
  { icon: QrCode, title: 'Instant QR codes', desc: 'Every link gets a downloadable QR code, perfect for print and offline campaigns.' },
];

const LandingPage = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleTry = (e) => {
    e.preventDefault();
    navigate(isAuthenticated ? '/dashboard' : '/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-white to-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-700 px-3.5 py-1.5 text-xs font-semibold mb-6">
          <Zap size={13} /> Fast, secure link management
        </span>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-ink-900 tracking-tight leading-[1.1]">
          Shorten links. <br className="hidden sm:block" />
          <span className="text-brand-600">Understand your audience.</span>
        </h1>
        <p className="mt-5 text-lg text-ink-600 max-w-2xl mx-auto">
          shortify turns long URLs into powerful, trackable short links — with real-time analytics, QR codes,
          password protection, and expiration control, built for scale.
        </p>

        <form onSubmit={handleTry} className="mt-9 max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a long URL to shorten it..."
              className="input pl-11 !py-3.5 shadow-soft"
            />
          </div>
          <button type="submit" className="btn-primary !py-3.5 whitespace-nowrap">
            Shorten it free <ArrowRight size={16} />
          </button>
        </form>
        <p className="text-xs text-ink-400 mt-3">No credit card required · Free forever plan</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:-translate-y-0.5 transition-transform">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <f.icon size={19} />
              </div>
              <h3 className="font-semibold text-ink-900">{f.title}</h3>
              <p className="text-sm text-ink-500 mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-400">
        © {new Date().getFullYear()} shortify. Built for scale, security, and speed.
      </footer>
    </div>
  );
};

export default LandingPage;
