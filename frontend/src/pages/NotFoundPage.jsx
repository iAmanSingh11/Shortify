import { Link } from 'react-router-dom';
import { LinkIcon } from 'lucide react';
import Logo from '../components/Logo.jsx';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4 text-center">
    <div>
      <div className="flex justify-center mb-8">
        <Logo />
      </div>
      <div className="h-14 w-14 mx-auto rounded-2xl bg-ink-100 text-ink-400 flex items-center justify-center mb-5">
        <LinkIcon size={26} />
      </div>
      <h1 className="text-3xl font-bold text-ink-900 font-display">404</h1>
      <p className="text-ink-500 mt-2 mb-6">This page or this short link doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  </div>
);

export default NotFoundPage;
