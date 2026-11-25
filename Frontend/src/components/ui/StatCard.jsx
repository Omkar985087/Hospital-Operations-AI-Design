import { StatusBadge } from './StatusBadge';

export function StatCard({
  label,
  value,
  icon: Icon,
  subtitle,
  dataSource, // 'LIVE' | 'DEMO' | undefined
  accent = 'teal', // 'teal' | 'navy' | 'success' | 'error' | 'warning'
  loading = false,
}) {
  const accentStyles = {
    teal: 'bg-[#CCFBF1] text-[#0F766E]',
    navy: 'bg-slate-100 text-[#0F172A]',
    success: 'bg-emerald-50 text-[#16A34A]',
    error: 'bg-red-50 text-[#DC2626]',
    warning: 'bg-amber-50 text-[#D97706]',
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
              {label}
            </p>
            {dataSource && (
              <StatusBadge
                status={dataSource}
                showDot={false}
                className="!px-2 !py-0 text-[10px]"
              />
            )}
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A] tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-[#64748B] truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              accentStyles[accent] || accentStyles.teal
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;

