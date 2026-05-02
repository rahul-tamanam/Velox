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

  const displayName = user?.name ?? 'Jordan Belfort';
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

  return (
    <aside
      className={clsx(
        'relative hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[#111111] transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-14' : 'w-[220px]'
      )}
    >
      {collapsed && (
        <div className="flex shrink-0 justify-center px-2 pt-3">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-secondary)]"
            aria-label="Expand sidebar"
          >
            <ChevronRightIcon className="h-4 w-4 opacity-60" />
          </button>
        </div>
      )}

      {!collapsed && (
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pb-2 pt-4">
          <span className="text-lg font-semibold tracking-tight text-[var(--accent)]">Velox</span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-secondary)]"
            aria-label="Collapse sidebar"
          >
            <ChevronLeftIcon className="h-4 w-4 opacity-60" />
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
                'group flex items-center rounded-md text-sm font-semibold leading-snug tracking-tight transition-colors duration-150 ease-out',
                collapsed ? 'justify-center' : 'text-left',
                isActive
                  ? clsx(
                      'bg-white text-[#0a0a0a]',
                      collapsed
                        ? 'mx-auto my-0.5 h-9 w-9 shrink-0 rounded-md px-0 py-0'
                        : 'mx-1.5 my-0.5 gap-2 px-2 py-1'
                    )
                  : clsx(
                      'bg-transparent py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
                      collapsed ? 'px-0' : 'gap-2.5 px-2.5'
                    )
              )}
            >
              <Icon
                className={clsx(
                  'h-4 w-4 shrink-0 transition-colors duration-150',
                  isActive ? 'text-[#0a0a0a] opacity-100' : 'opacity-60 group-hover:opacity-90'
                )}
                aria-hidden
              />
              <span
                className={clsx(
                  'truncate transition-opacity duration-150 ease-out',
                  collapsed ? 'max-w-0 overflow-hidden opacity-0' : 'max-w-[148px] opacity-100'
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
              'panel-elevated absolute bottom-full z-50 mb-2 w-[220px] py-1',
              collapsed ? 'left-1/2 -translate-x-1/2' : 'left-0'
            )}
            role="menu"
          >
            <p className="ds-body px-3 pt-2 leading-snug">{displayEmail}</p>
            <div className="my-2 h-px bg-[var(--border-subtle)]" />
            <button
              type="button"
              role="menuitem"
              onClick={handleProfile}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
            >
              <UserCircleIcon className="h-4 w-4 opacity-60" />
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 opacity-60" />
              Sign out
            </button>
          </div>
        )}

        {collapsed ? (
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
              menuOpen && 'border-[var(--border)] ring-1 ring-[var(--border)]'
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
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pl-1 pr-2 text-left hover:bg-[var(--bg-surface-hover)]"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-[13px] font-semibold text-[var(--text-primary)]">
              {initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">{displayName}</span>
            <EllipsisVerticalIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-60" aria-hidden />
          </button>
        )}
      </div>
    </aside>
  );
}
