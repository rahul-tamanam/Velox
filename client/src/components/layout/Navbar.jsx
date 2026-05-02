import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar({ simple = false }) {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
      <Link to="/" className="font-display text-xl font-semibold tracking-tight text-[var(--accent)]">
        Velox
      </Link>
      {!simple && (
        <nav className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <Link to="/login" className="hover:text-[var(--text-primary)]">
            Sign in
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link to="/register" className="ds-btn-primary inline-flex font-medium">
              Get Started
            </Link>
          </motion.div>
        </nav>
      )}
    </header>
  );
}
