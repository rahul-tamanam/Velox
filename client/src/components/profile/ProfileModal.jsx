import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext.jsx';
import { QUESTIONS } from '../../pages/Onboarding.jsx';

function parseAnswers(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(Number);
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(Number) : [];
  } catch {
    return [];
  }
}

function deriveRiskFromScores(scores) {
  const sum = scores.reduce((a, b) => a + b, 0);
  if (sum <= -2) return 'conservative';
  if (sum >= 4) return 'aggressive';
  return 'moderate';
}

function RiskBadge({ profile }) {
  const { label, className } = useMemo(() => {
    const p = String(profile || 'moderate').toLowerCase();
    if (p === 'conservative')
      return { label: 'Conservative', className: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40' };
    if (p === 'aggressive')
      return { label: 'Aggressive', className: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' };
    return { label: 'Moderate', className: 'bg-[#F0B429]/15 text-[#F0B429] ring-1 ring-[#F0B429]/35' };
  }, [profile]);

  return (
    <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', className)}>
      {label}
    </span>
  );
}

export default function ProfileModal({ open, onClose }) {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [pwdMasked, setPwdMasked] = useState(true);
  const [pwdSectionOpen, setPwdSectionOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const [editingAnswers, setEditingAnswers] = useState(false);
  const [editScores, setEditScores] = useState(() => Array.from({ length: QUESTIONS.length }, () => null));
  const [answersError, setAnswersError] = useState('');
  const [answersSaving, setAnswersSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const scores = useMemo(() => parseAnswers(user?.onboarding_answers), [user?.onboarding_answers]);

  useEffect(() => {
    if (!open) {
      setPwdSectionOpen(false);
      setPwdError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEditingAnswers(false);
      setAnswersError('');
      setShowDeleteConfirm(false);
      setDeleteSubmitting(false);
      setDeleteError('');
    }
  }, [open]);

  useEffect(() => {
    if (open && user) {
      const base = parseAnswers(user.onboarding_answers);
      setEditScores(
        Array.from({ length: QUESTIONS.length }, (_, i) =>
          base[i] !== undefined && base[i] !== null ? base[i] : null
        )
      );
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const displayName = user?.name ?? '—';
  const displayEmail = user?.email ?? '—';

  async function submitPassword(e) {
    e.preventDefault();
    setPwdError('');
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    setPwdSaving(true);
    try {
      await api.patch('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdSectionOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.error || err.message || 'Could not update password');
    } finally {
      setPwdSaving(false);
    }
  }

  const allPicked = editScores.every((s) => s !== null && s !== undefined);

  async function saveEditedAnswers() {
    setAnswersError('');
    if (!allPicked) {
      setAnswersError('Select an answer for each question.');
      return;
    }
    const nums = editScores.map(Number);
    const risk_profile = deriveRiskFromScores(nums);
    setAnswersSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        risk_profile,
        onboarding_answers: JSON.stringify(nums),
      });
      if (data?.user) {
        localStorage.setItem('velox_user', JSON.stringify(data.user));
        setUser(data.user);
      }
      setEditingAnswers(false);
    } catch (err) {
      setAnswersError(err.response?.data?.error || err.message || 'Could not save answers');
    } finally {
      setAnswersSaving(false);
    }
  }

  async function confirmDeleteAccount() {
    setDeleteError('');
    setDeleteSubmitting(true);
    try {
      await api.delete('/auth/account');
      onClose();
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || err.message || 'Could not delete account');
      setDeleteSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-10 pb-16 sm:pt-16"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0d1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="border-b border-white/[0.06] px-6 pb-4 pt-6 pr-14">
          <h2 id="profile-modal-title" className="font-display text-xl text-[#F0B429]">
            Profile
          </h2>
          <p className="mt-1 text-sm text-white/45">Account and risk questionnaire</p>
        </div>

        <div className="max-h-[min(70vh,720px)] space-y-6 overflow-y-auto px-6 py-6">
          <section className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40">Name</p>
              <p className="mt-0.5 text-sm font-medium text-white/90">{displayName}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40">Email</p>
              <p className="mt-0.5 text-sm font-medium text-white/90">{displayEmail}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40">Password</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm tracking-widest text-white/85">
                  {pwdMasked ? '••••••••' : '********'}
                </span>
                <button
                  type="button"
                  onClick={() => setPwdMasked((m) => !m)}
                  className="rounded-lg p-1.5 text-[#F0B429]/80 transition-colors hover:bg-white/[0.06] hover:text-[#F0B429]"
                  aria-label={pwdMasked ? 'Show password' : 'Hide password'}
                >
                  {pwdMasked ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-white/35">
                {pwdMasked ? 'Password is stored securely on the server.' : 'Your password is never shown after signup.'}
              </p>
            </div>
          </section>

          <section className="border-t border-white/[0.06] pt-6">
            <button
              type="button"
              onClick={() => setPwdSectionOpen((o) => !o)}
              className="text-sm font-semibold text-[#F0B429] transition-opacity hover:opacity-90"
            >
              {pwdSectionOpen ? 'Cancel change password' : 'Change password'}
            </button>
            {pwdSectionOpen && (
              <form onSubmit={submitPassword} className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-white/50">Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none ring-[#F0B429]/30 focus:ring-2"
                    autoComplete="current-password"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-white/50">New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none ring-[#F0B429]/30 focus:ring-2"
                    autoComplete="new-password"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-white/50">Confirm new password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none ring-[#F0B429]/30 focus:ring-2"
                    autoComplete="new-password"
                  />
                </label>
                {pwdError && <p className="text-sm text-red-400">{pwdError}</p>}
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="rounded-xl bg-[#F0B429] px-4 py-2 text-sm font-semibold text-[#0d1117] transition-opacity disabled:opacity-50"
                >
                  {pwdSaving ? 'Saving…' : 'Update password'}
                </button>
              </form>
            )}
          </section>

          <section className="border-t border-white/[0.06] pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] uppercase tracking-wider text-white/40">Risk profile</p>
              <RiskBadge profile={user?.risk_profile} />
            </div>
          </section>

          <section className="border-t border-white/[0.06] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white/90">Onboarding answers</p>
              {!editingAnswers ? (
                <button
                  type="button"
                  onClick={() => setEditingAnswers(true)}
                  className="text-sm font-semibold text-[#F0B429] hover:opacity-90"
                >
                  Edit answers
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAnswers(false);
                      const base = parseAnswers(user?.onboarding_answers);
                      setEditScores(
                        Array.from({ length: QUESTIONS.length }, (_, i) =>
                          base[i] !== undefined && base[i] !== null ? base[i] : null
                        )
                      );
                      setAnswersError('');
                    }}
                    className="text-sm text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!allPicked || answersSaving}
                    onClick={saveEditedAnswers}
                    className="rounded-lg bg-[#F0B429] px-3 py-1.5 text-sm font-semibold text-[#0d1117] disabled:opacity-40"
                  >
                    {answersSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            <ul className="mt-4 space-y-5">
              {QUESTIONS.map((q, qi) => {
                const savedScore = scores[qi];
                const chosen =
                  savedScore !== undefined && savedScore !== null
                    ? q.options.find((o) => o.score === savedScore)?.label ?? '—'
                    : '—';

                return (
                  <li key={q.id}>
                    <p className="text-sm font-medium text-white/85">{q.prompt}</p>
                    {!editingAnswers ? (
                      <p className="mt-1.5 text-sm text-[#F0B429]/90">{chosen}</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {q.options.map((opt) => {
                          const selected = editScores[qi] === opt.score;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => {
                                const next = [...editScores];
                                next[qi] = opt.score;
                                setEditScores(next);
                              }}
                              className={clsx(
                                'rounded-xl border px-3 py-2 text-left text-xs transition-colors sm:text-sm',
                                selected
                                  ? 'border-[#F0B429] bg-[#F0B429]/10 text-[#F0B429]'
                                  : 'border-white/[0.08] bg-white/[0.03] text-white/75 hover:border-white/20'
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {answersError && <p className="mt-3 text-sm text-red-400">{answersError}</p>}
          </section>

          <section className="border-t border-white/[0.06] pt-6">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-xl border border-red-400/20 bg-transparent px-4 py-3 text-center text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                Delete account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-white/80">
                  This will permanently delete your account and all data.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    onClick={confirmDeleteAccount}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    {deleteSubmitting ? 'Deleting…' : 'Yes, delete my account'}
                  </button>
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError('');
                    }}
                    className="rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
                {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
