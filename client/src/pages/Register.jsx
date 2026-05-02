import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans">
      <Navbar simple />
      <div className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Create Velox</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Local JWT auth · your data stays on this machine.
          </p>
        </motion.div>
        <form onSubmit={submit} className="card-surface space-y-4 p-6">
          {['name', 'email', 'password', 'confirm'].map((field) => (
            <label key={field} className="block text-xs capitalize text-[var(--text-secondary)]">
              {field === 'confirm' ? 'Confirm password' : field}
              <input
                type={field.includes('password') || field === 'confirm' ? 'password' : field === 'email' ? 'email' : 'text'}
                required
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </label>
          ))}
          {error && <p className="text-sm text-[var(--accent-red)]">{error}</p>}
          <button type="submit" className="ds-btn-primary w-full py-3 font-medium">
            Continue
          </button>
          <p className="text-center text-xs text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link className="text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)]" to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
