import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const apiErr = err.response?.data?.error;
      const hint =
        err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? ' Cannot reach API - make sure `npm run dev` is running and the server shows port 5000.'
          : '';
      setError(apiErr || `${err.message || 'Login failed'}.${hint}`);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans">
      <Navbar simple />
      <div className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Demo · demo@velox.com / demo1234</p>
        </motion.div>
        <form onSubmit={submit} className="card-surface space-y-4 p-6">
          <label className="block text-xs text-[var(--text-secondary)]">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-xs text-[var(--text-secondary)]">
            Password
            <input
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-[var(--accent-red)]">{error}</p>}
          <button type="submit" className="ds-btn-primary w-full py-3 font-medium">
            Sign in
          </button>
          <p className="text-center text-xs text-[var(--text-secondary)]">
            New here?{' '}
            <Link className="text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)]" to="/register">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
