import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowRightOnRectangleIcon,
  BeakerIcon,
  BriefcaseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  NewspaperIcon,
  Squares2X2Icon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';

const STORAGE_KEY = 'velox_sidebar_collapsed';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: Squares2X2Icon },
  { id: 'portfolio', label: 'Portfolio', Icon: BriefcaseIcon },
  { id: 'simulate', label: 'Simulate', Icon: BeakerIcon },
  { id: 'tools', label: 'Tools', Icon: WrenchScrewdriverIcon },
  { id: 'goals', label: 'Goals', Icon: FlagIcon },
  { id: 'news', label: 'News', Icon: NewspaperIcon },
];

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Sidebar({ active, onSelect, onOpenProfile }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      if (typeof window === 'undefined') return true;
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === null) return true;
      return v === 'true';
    } catch {
      return true;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    if (collapsed) setMenuOpen(false);
  }, [collapsed]);

  useEffect(() => {
    function handlePointerDown(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const displayName = user?.name ?? 'Demo Investor';
  const displayEmail = user?.email ?? 'demo@velox.app';
  const initials = initialsFromName(displayName);

  function handleSignOut() {
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  function handleProfile() {
    setMenuOpen(false);
    onOpenProfile?.();
  }

  const iconIdle = 'text-white/50 group-hover:text-white/90';
  const iconActive = 'text-[#F0B429]';

  return (
    <aside
      className={clsx(
        'relative hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-[rgba(255,255,255,0.06)] bg-[#0d1117] transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-14' : 'w-[200px]'
      )}
    >
      {/* Collapsed: expand toggle only */}
      {collapsed && (
        <div className="flex shrink-0 justify-center px-2 pt-3">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/90"
            aria-label="Expand sidebar"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Expanded: wordmark row + collapse */}
      {!collapsed && (
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pb-3 pt-4">
          <span className="font-display text-lg font-semibold tracking-tight text-[#F0B429]">VELOX</span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/90"
            aria-label="Collapse sidebar"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <nav
        className={clsx(
          'flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2',
          collapsed && 'pt-1'
        )}
        aria-label="Main"
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={clsx(
                'group flex items-center rounded-lg py-2.5 text-sm transition-opacity duration-150 ease-out',
                collapsed ? 'justify-center px-0' : 'gap-3 px-3 text-left',
                isActive ? 'bg-[rgba(240,180,41,0.08)]' : 'bg-transparent hover:bg-white/[0.04]'
              )}
            >
              <Icon
                className={clsx(
                  'h-5 w-5 shrink-0 transition-colors duration-150',
                  isActive ? iconActive : iconIdle
                )}
                aria-hidden
              />
              <span
                className={clsx(
                  'truncate font-medium transition-opacity duration-150 ease-out',
                  collapsed ? 'max-w-0 overflow-hidden opacity-0' : 'max-w-[148px] opacity-100',
                  isActive ? 'text-[#F0B429]' : 'text-white/50 group-hover:text-white/90'
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div
        ref={menuRef}
        className={clsx(
          'relative mt-auto shrink-0 px-2 pb-3 pt-2',
          collapsed ? 'flex justify-center' : 'flex items-center gap-2 px-3'
        )}
      >
        {menuOpen && (
          <div
            className={clsx(
              'absolute bottom-full z-50 mb-2 w-[220px] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d1117] py-1 shadow-xl',
              collapsed ? 'left-1/2 -translate-x-1/2' : 'left-0'
            )}
            role="menu"
          >
            <p className="px-3 pt-2 text-[11px] leading-snug text-white/45">{displayEmail}</p>
            <div className="my-2 h-px bg-[rgba(255,255,255,0.08)]" />
            <button
              type="button"
              role="menuitem"
              onClick={handleProfile}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <UserCircleIcon className="h-4 w-4 text-white/50" />
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 text-white/50" />
              Sign out
            </button>
          </div>
        )}

        {collapsed ? (
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0B429] text-[13px] font-semibold text-[#0a0f1e] transition-opacity hover:opacity-90',
              menuOpen && 'ring-2 ring-[#F0B429]/40'
            )}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            {initials}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 text-left transition-colors hover:bg-white/[0.04]"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0B429] text-[13px] font-semibold text-[#0a0f1e]">
              {initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">{displayName}</span>
            <EllipsisVerticalIcon className="h-5 w-5 shrink-0 text-white/40" aria-hidden />
          </button>
        )}
      </div>
    </aside>
  );
}
