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
      return {
        label: 'Conservative',
        className: 'border-[var(--border)] bg-[rgba(255,255,255,0.035)] text-[var(--text-secondary)]',
      };
    if (p === 'aggressive')
      return {
        label: 'Aggressive',
        className: 'border-[var(--border)] bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]',
      };
    return {
      label: 'Moderate',
      className: 'border-[var(--border)] bg-[rgba(255,255,255,0.055)] text-[var(--text-secondary)]',
    };
  }, [profile]);

  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.05em]',
        className
      )}
    >
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

  const displayName = user?.name ?? 'N/A';
  const displayEmail = user?.email ?? 'N/A';

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
        className="relative my-auto w-full max-w-lg rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-secondary)]"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="border-b border-[var(--border-subtle)] px-6 pb-4 pt-6 pr-14">
          <h2 id="profile-modal-title" className="font-display text-xl text-[var(--text-primary)]">
            Profile
          </h2>
          <p className="ds-body mt-1">Account and risk questionnaire</p>
        </div>

        <div className="max-h-[min(70vh,720px)] space-y-6 overflow-y-auto px-6 py-6">
          <section className="space-y-3">
            <div>
              <p className="ds-label uppercase tracking-[0.05em]">Name</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{displayName}</p>
            </div>
            <div>
              <p className="ds-label uppercase tracking-[0.05em]">Email</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{displayEmail}</p>
            </div>
            <div>
              <p className="ds-label uppercase tracking-[0.05em]">Password</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm tracking-widest text-[var(--text-primary)]">
                  {pwdMasked ? '••••••••' : '********'}
                </span>
                <button
                  type="button"
                  onClick={() => setPwdMasked((m) => !m)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-secondary)]"
                  aria-label={pwdMasked ? 'Show password' : 'Hide password'}
                >
                  {pwdMasked ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-[0.72rem] text-[var(--text-muted)]">
                {pwdMasked ? 'Password is stored securely on the server.' : 'Your password is never shown after signup.'}
              </p>
            </div>
          </section>

          <section className="border-t border-[var(--border-subtle)] pt-6">
            <button
              type="button"
              onClick={() => setPwdSectionOpen((o) => !o)}
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {pwdSectionOpen ? 'Cancel change password' : 'Change password'}
            </button>
            {pwdSectionOpen && (
              <form onSubmit={submitPassword} className="mt-4 space-y-3">
                <label className="block">
                  <span className="ds-body">Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--text-muted)]"
                    autoComplete="current-password"
                  />
                </label>
                <label className="block">
                  <span className="ds-body">New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--text-muted)]"
                    autoComplete="new-password"
                  />
                </label>
                <label className="block">
                  <span className="ds-body">Confirm new password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--text-muted)]"
                    autoComplete="new-password"
                  />
                </label>
                {pwdError && <p className="text-sm text-[var(--accent-red)]">{pwdError}</p>}
                <button type="submit" disabled={pwdSaving} className="ds-btn-primary disabled:opacity-50">
                  {pwdSaving ? 'Saving…' : 'Update password'}
                </button>
              </form>
            )}
          </section>

          <section className="border-t border-[var(--border-subtle)] pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="ds-label uppercase tracking-[0.05em]">Risk profile</p>
              <RiskBadge profile={user?.risk_profile} />
            </div>
          </section>

          <section className="border-t border-[var(--border-subtle)] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Onboarding answers</p>
              {!editingAnswers ? (
                <button
                  type="button"
                  onClick={() => setEditingAnswers(true)}
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!allPicked || answersSaving}
                    onClick={saveEditedAnswers}
                    className="ds-btn-primary disabled:opacity-40"
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
                    ? q.options.find((o) => o.score === savedScore)?.label ?? 'N/A'
                    : 'N/A';

                return (
                  <li key={q.id}>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{q.prompt}</p>
                    {!editingAnswers ? (
                      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{chosen}</p>
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
                                'rounded-lg border px-3 py-2 text-left text-[0.8rem] transition-colors',
                                selected
                                  ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                                  : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
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
            {answersError && <p className="mt-3 text-sm text-[var(--accent-red)]">{answersError}</p>}
          </section>

          <section className="border-t border-[var(--border-subtle)] pt-6">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-lg border border-[rgba(248,113,113,0.35)] bg-transparent px-4 py-3 text-center text-sm font-medium text-[var(--accent-red)] transition-colors hover:bg-[rgba(248,113,113,0.08)]"
              >
                Delete account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="ds-body text-[var(--text-primary)]">
                  This will permanently delete your account and all data.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    onClick={confirmDeleteAccount}
                    className="rounded-lg border border-[rgba(248,113,113,0.45)] bg-[var(--btn-primary-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-red)] transition-colors hover:bg-[var(--btn-primary-hover)] disabled:opacity-50"
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
                    className="ds-btn-primary disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
                {deleteError && <p className="text-sm text-[var(--accent-red)]">{deleteError}</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
