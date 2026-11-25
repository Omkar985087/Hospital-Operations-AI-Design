import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  CalendarClock,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspaceData';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { backendStatus } = useWorkspace();

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const statusConfig = {
    online: { dot: 'bg-[#16A34A]', text: 'Backend Online', sub: '127.0.0.1:8000' },
    offline: { dot: 'bg-[#DC2626]', text: 'Backend Offline', sub: 'Check FastAPI' },
    checking: { dot: 'bg-[#D97706] animate-pulse', text: 'Checking API…', sub: 'Connecting' },
  }[backendStatus.state] || { dot: 'bg-slate-400', text: 'Unknown', sub: '' };

  const renderContent = (isMobile = false) => {
    const isCompact = !isMobile && collapsed;

    return (
      <div className="flex h-full flex-col bg-white border-r border-[#E2E8F0]">
        {/* Brand header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-[#E2E8F0] px-4 ${
            isCompact ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F172A] text-white shadow-sm">
              <Activity className="h-5 w-5 text-[#2DD4BF]" aria-hidden="true" />
            </div>
            {!isCompact && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-[#0F172A]">
                  Hospital Ops AI
                </p>
                <p className="truncate text-[11px] font-medium text-[#64748B]">
                  Admin &amp; RAG Suite
                </p>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="rounded-md p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            !isCompact && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="rounded-md p-1.5 text-[#64748B] transition-colors hover:bg-slate-100 hover:text-[#0F172A]"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )
          )}
        </div>

        {/* Navigation links */}
        <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {!isCompact && (
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Operations
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => {
                  if (isMobile) onCloseMobile();
                }}
                title={isCompact ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                    isCompact ? 'justify-center' : 'gap-3'
                  } ${
                    isActive
                      ? 'bg-[#CCFBF1] text-[#0F766E]'
                      : 'text-[#1E293B] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#0F766E]'
                          : 'text-[#64748B] group-hover:text-[#0F172A]'
                      }`}
                      aria-hidden="true"
                    />
                    {!isCompact && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer collapse trigger + live backend indicator */}
        <div className="border-t border-[#E2E8F0] p-3 space-y-2">
          {isCompact && !isMobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="flex w-full items-center justify-center rounded-md p-2 text-[#64748B] transition-colors hover:bg-slate-100 hover:text-[#0F172A]"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          <div
            className={`flex items-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 ${
              isCompact ? 'justify-center' : 'gap-2.5'
            }`}
            title={`${statusConfig.text} (${statusConfig.sub})`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusConfig.dot}`} />
            {!isCompact && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[#0F172A]">
                  {statusConfig.text}
                </p>
                <p className="truncate text-[11px] text-[#64748B]">{statusConfig.sub}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block transition-all duration-200 ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-64'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-elevated">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;

