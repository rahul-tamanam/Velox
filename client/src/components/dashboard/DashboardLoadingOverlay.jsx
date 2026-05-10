import { motion } from 'framer-motion';

export default function DashboardLoadingOverlay() {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-xl bg-[var(--bg-primary)]/85 backdrop-blur-[2px]"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
        aria-hidden
      />
      <p className="text-sm font-medium text-[var(--text-secondary)]">Loading portfolio…</p>
    </motion.div>
  );
}
