const STATUS_STYLES = {
  BOOKED: {
    classes: 'bg-[#CCFBF1] text-[#0F766E] border-teal-200',
    dot: 'bg-[#0F766E]',
    label: 'Booked',
  },
  CONFIRMED: {
    classes: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    dot: 'bg-[#16A34A]',
    label: 'Confirmed',
  },
  REGISTERED: {
    classes: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    dot: 'bg-[#16A34A]',
    label: 'Registered',
  },
  SUCCESS: {
    classes: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    dot: 'bg-[#16A34A]',
    label: 'Ingested',
  },
  INGESTED: {
    classes: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    dot: 'bg-[#16A34A]',
    label: 'Ingested',
  },
  ONLINE: {
    classes: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    dot: 'bg-[#16A34A]',
    label: 'Live API',
  },
  CANCELLED: {
    classes: 'bg-red-50 text-[#DC2626] border-red-200',
    dot: 'bg-[#DC2626]',
    label: 'Cancelled',
  },
  FAILED: {
    classes: 'bg-red-50 text-[#DC2626] border-red-200',
    dot: 'bg-[#DC2626]',
    label: 'Failed',
  },
  OFFLINE: {
    classes: 'bg-red-50 text-[#DC2626] border-red-200',
    dot: 'bg-[#DC2626]',
    label: 'Offline',
  },
  COMPLETED: {
    classes: 'bg-slate-100 text-[#475569] border-slate-200',
    dot: 'bg-slate-500',
    label: 'Completed',
  },
  PENDING: {
    classes: 'bg-amber-50 text-[#D97706] border-amber-200',
    dot: 'bg-[#D97706]',
    label: 'Pending',
  },
  PROCESSING: {
    classes: 'bg-amber-50 text-[#D97706] border-amber-200',
    dot: 'bg-[#D97706]',
    label: 'Processing',
  },
  DEMO: {
    classes: 'bg-amber-50 text-[#B45309] border-amber-200/80',
    dot: 'bg-[#D97706]',
    label: 'Demo Data',
  },
  LIVE: {
    classes: 'bg-[#CCFBF1]/70 text-[#0F766E] border-teal-200',
    dot: 'bg-[#0F766E]',
    label: 'Live Backend',
  },
};

export function StatusBadge({ status, label, showDot = true, className = '' }) {
  const key = String(status || 'COMPLETED').toUpperCase();
  const style = STATUS_STYLES[key] || {
    classes: 'bg-slate-100 text-[#475569] border-slate-200',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${style.classes} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />}
      {label || style.label}
    </span>
  );
}

export default StatusBadge;

