import { Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '' }) => (
  <Link to="/" className={`flex items-center gap-2 select-none ${className}`}>
    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
      <Link2 size={18} strokeWidth={2.5} />
    </span>
    <span className="font-display text-lg font-bold text-ink-900">shortify</span>
  </Link>
);

export default Logo;
