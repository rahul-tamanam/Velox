import { useState } from 'react';
import { motion } from 'framer-motion';
import { fmtUsd } from '../../utils/formatters';
import NumberStepperInput from '../ui/NumberStepperInput.jsx';
import api from '../../utils/api';

export default function GoalTrackerWidget({
  user,
  currentValue,
  yearsToGoalMc,
  onUpdated,
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    goal_name: user?.goal_name || 'Retirement',
    goal_target_amount: user?.goal_target_amount || 1_000_000,
    goal_target_year: user?.goal_target_year || 2045,
  });

  const progress = Math.min(1, (currentValue || 0) / (user?.goal_target_amount || 1));
  const milestones = [0.25, 0.5, 0.75, 1];

  async function save() {
    const { data } = await api.patch('/auth/profile', form);
    if (data?.user) {
      localStorage.setItem('velox_user', JSON.stringify(data.user));
      onUpdated?.(data.user);
    }
    setOpen(false);
  }

  return (
    <div className="card-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Goal tracker</p>
          <p className="font-display text-xl font-semibold">{user?.goal_name}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Target {fmtUsd(user?.goal_target_amount)} by {user?.goal_target_year}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-[var(--accent-gold)] px-3 py-1 text-xs text-[var(--accent-gold)]"
        >
          Edit
        </button>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>{fmtUsd(currentValue)}</span>
          <span>{fmtUsd(user?.goal_target_amount)}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-light)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="relative mt-2 h-6">
          {milestones.map((m) => (
            <span
              key={m}
              className="absolute top-0 text-[10px] text-[var(--text-secondary)]"
              style={{ left: `${m * 100}%`, transform: 'translateX(-50%)' }}
            >
              {m * 100}%
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        At your simulated median growth path, you could reach this goal in approximately{' '}
        <span className="font-mono text-[var(--text-primary)]">
          {yearsToGoalMc != null ? `${yearsToGoalMc.toFixed(1)} yrs` : '—'}
        </span>
        .
      </p>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card-surface max-w-md border border-[var(--border)] p-6">
            <p className="font-display text-lg">Update goal</p>
            <label className="mt-4 block text-xs text-[var(--text-secondary)]">Name</label>
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
              value={form.goal_name}
              onChange={(e) => setForm({ ...form, goal_name: e.target.value })}
            />
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Target amount</label>
            <NumberStepperInput
              className="mt-1 font-mono"
              step={1000}
              min={0}
              value={form.goal_target_amount}
              onChange={(e) => setForm({ ...form, goal_target_amount: Number(e.target.value) })}
            />
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Target year</label>
            <NumberStepperInput
              className="mt-1 font-mono"
              step={1}
              min={2000}
              max={2100}
              value={form.goal_target_year}
              onChange={(e) => setForm({ ...form, goal_target_year: Number(e.target.value) })}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm text-[var(--text-secondary)]"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-[var(--accent-gold)] px-5 py-2 text-sm font-semibold text-[var(--bg-primary)]"
                onClick={save}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
