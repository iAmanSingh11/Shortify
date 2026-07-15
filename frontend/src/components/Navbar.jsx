import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu, X, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Logo />

        {isAuthenticated ? (
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost">
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button onClick={() => navigate('/api-keys')} className="btn-ghost">
              <KeyRound size={16} /> API Keys
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="btn-ghost text-brand-600">
                <ShieldCheck size={16} /> Admin
              </button>
            )}
            <div className="h-6 w-px bg-ink-200 mx-1" />
            <span className="text-sm text-ink-600 px-1">{user?.name}</span>
            <button onClick={handleLogout} className="btn-secondary !py-2">
              <LogOut size={15} /> Logout
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-ghost">
              Sign in
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary">
              Get started free
            </button>
          </div>
        )}

        <button className="sm:hidden text-ink-700" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-ink-100 bg-white px-4 py-3 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="btn-ghost justify-start">
                Dashboard
              </button>
              <button onClick={() => navigate('/api-keys')} className="btn-ghost justify-start">
                API Keys
              </button>
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className="btn-ghost justify-start text-brand-600">
                  Admin
                </button>
              )}
              <button onClick={handleLogout} className="btn-secondary justify-start">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-ghost justify-start">
                Sign in
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary justify-start">
                Get started free
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
