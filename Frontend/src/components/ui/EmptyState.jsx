export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-[#E2E8F0] bg-slate-50 text-[#64748B]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-xs leading-relaxed text-[#64748B]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;

