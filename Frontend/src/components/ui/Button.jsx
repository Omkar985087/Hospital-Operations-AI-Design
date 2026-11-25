import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary:
    'bg-[#0F766E] text-white border-transparent hover:bg-[#115E59] shadow-sm disabled:bg-[#0F766E]/60',
  secondary:
    'bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-slate-50 hover:border-slate-300 shadow-card disabled:bg-slate-50 disabled:text-slate-400',
  danger:
    'bg-[#DC2626] text-white border-transparent hover:bg-red-700 shadow-sm disabled:bg-red-400',
  dangerOutline:
    'bg-white text-[#DC2626] border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50',
  ghost:
    'bg-transparent text-[#64748B] border-transparent hover:bg-slate-100 hover:text-[#0F172A] disabled:opacity-50',
};

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
      } ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;

