import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';

export const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'How would you react if your portfolio dropped 20%?',
    options: [
      { label: 'Panic sell', score: -2 },
      { label: 'Hold steady', score: 0 },
      { label: 'Buy more', score: 2 },
    ],
  },
  {
    id: 'q2',
    prompt: 'Primary investment goal?',
    options: [
      { label: 'Preserve wealth', score: -2 },
      { label: 'Steady growth', score: 0 },
      { label: 'Aggressive growth', score: 2 },
    ],
  },
  {
    id: 'q3',
    prompt: 'When do you need this money?',
    options: [
      { label: '< 3 years', score: -2 },
      { label: '3 - 10 years', score: 0 },
      { label: '10+ years', score: 2 },
    ],
  },
  {
    id: 'q4',
    prompt: 'Investing experience?',
    options: [
      { label: 'None', score: -1 },
      { label: 'Some', score: 0 },
      { label: 'Experienced', score: 1 },
    ],
  },
  {
    id: 'q5',
    prompt: 'Starting corpus?',
    options: [
      { label: '< $10k', score: -1 },
      { label: '$10k - $50k', score: 0 },
      { label: '$50k+', score: 1 },
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  async function finish(profile, scores) {
    const { data } = await api.patch('/auth/profile', {
      risk_profile: profile,
      onboarding_answers: JSON.stringify(scores),
    });
    if (data?.user) {
      localStorage.setItem('velox_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    navigate('/dashboard');
  }

  function choose(score) {
    const next = [...answers, score];
    setAnswers(next);
    if (step >= QUESTIONS.length - 1) {
      const s = next.reduce((a, b) => a + b, 0);
      const profile = s <= -2 ? 'conservative' : s >= 4 ? 'aggressive' : 'moderate';
      finish(profile, next);
      return;
    }
    setStep(step + 1);
  }

  const q = QUESTIONS[step];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] px-6 py-12 font-sans">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
        <p className="text-[0.65rem] font-normal uppercase tracking-[0.08em] text-[var(--text-muted)]">Onboarding</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="card-surface mt-8 p-8"
          >
            <p className="text-sm text-[var(--text-secondary)]">
              Question {step + 1} / {QUESTIONS.length}
            </p>
            <h1 className="mt-4 font-display text-2xl">{q.prompt}</h1>
            <div className="mt-8 space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => choose(opt.score)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
