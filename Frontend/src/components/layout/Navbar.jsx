import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronRight,
  Menu,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspaceData';
import { formatDateTime, formatHeaderDate } from '../../utils/formatters';

export function Navbar({ title, breadcrumb, onOpenMobileMenu }) {
  const {
    globalSearch,
    setGlobalSearch,
    notifications,
    markNotificationsRead,
    clearNotifications,
    backendStatus,
  } = useWorkspace();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const toggleNotifs = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    setProfileOpen(false);
    if (next && unreadCount > 0) {
      markNotificationsRead();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left: mobile menu + breadcrumb + page title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] text-[#1E293B] hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <span>Hospital Ops</span>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <span className="font-medium text-[#0F766E] truncate">{breadcrumb || title}</span>
          </nav>
          <h1 className="truncate text-base font-semibold tracking-tight text-[#0F172A] sm:text-lg">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Search, Date, Notifications, User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global search */}
        <div className="relative hidden md:block w-60 lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Filter current view… (/)"
            aria-label="Search workspace"
            className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-8 text-sm text-[#1E293B] placeholder:text-slate-400 transition-colors focus:border-[#0F766E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Current date */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#1E293B]">
          <Calendar className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
          <span>{formatHeaderDate()}</span>
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={toggleNotifs}
            aria-label="Open notifications"
            aria-expanded={notifOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-slate-50 hover:text-[#0F172A]"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0F766E] px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-[#E2E8F0] bg-white shadow-elevated z-40">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#0F172A]">Activity Log</p>
                  <p className="text-[11px] text-[#64748B]">Recent session operations</p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#DC2626]"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-[#64748B]">
                    No recent operations recorded in this session yet.
                  </p>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="px-4 py-3 hover:bg-slate-50/60">
                      <p className="text-xs font-medium text-[#0F172A]">{item.title}</p>
                      {item.detail && (
                        <p className="mt-0.5 text-[11px] text-[#64748B]">{item.detail}</p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-label="User profile menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white py-1 pl-1.5 pr-2.5 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F172A] text-xs font-semibold text-white">
              HA
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium leading-tight text-[#0F172A]">Admin Desk</p>
              <p className="text-[10px] leading-tight text-[#64748B]">Operations</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E2E8F0] bg-white p-1.5 shadow-elevated z-40">
              <div className="border-b border-[#E2E8F0] px-3 py-2">
                <p className="text-xs font-semibold text-[#0F172A]">Hospital Admin Desk</p>
                <p className="text-[11px] text-[#64748B]">
                  API:{' '}
                  <span
                    className={
                      backendStatus.state === 'online'
                        ? 'font-medium text-[#16A34A]'
                        : 'font-medium text-[#DC2626]'
                    }
                  >
                    {backendStatus.state === 'online' ? 'Connected' : 'Disconnected'}
                  </span>
                </p>
              </div>
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-100"
              >
                <Settings className="h-3.5 w-3.5 text-[#64748B]" />
                Workspace Settings
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

