export function FormField({ id, label, required = false, error, hint, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-[#1E293B]">
          {label}
          {required && <span className="ml-0.5 text-[#DC2626]" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} role="alert" className="text-xs text-[#DC2626]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[#64748B]">{hint}</p>
      ) : null}
    </div>
  );
}

const baseInputClasses =
  'w-full rounded-md border bg-white px-3 text-sm text-[#1E293B] placeholder:text-slate-400 transition-colors focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

export function TextInput({ id, error, className = '', ...props }) {
  return (
    <input
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={`h-9 ${baseInputClasses} ${
        error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-red-500/15' : 'border-[#E2E8F0]'
      } ${className}`}
      {...props}
    />
  );
}

export function SelectInput({ id, error, children, className = '', ...props }) {
  return (
    <select
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={`h-9 ${baseInputClasses} ${
        error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-red-500/15' : 'border-[#E2E8F0]'
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function TextArea({ id, error, rows = 3, className = '', ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={Boolean(error)}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={`py-2 ${baseInputClasses} ${
        error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-red-500/15' : 'border-[#E2E8F0]'
      } ${className}`}
      {...props}
    />
  );
}

