import { useEffect } from 'react';
import { X } from 'lucide-react';

const MAX_WIDTH_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  preventClose = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !preventClose) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-[1px] transition-opacity"
        onClick={() => {
          if (!preventClose) onClose?.();
        }}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 flex max-h-[90vh] w-full flex-col rounded-lg border border-[#E2E8F0] bg-white shadow-elevated ${
          MAX_WIDTH_MAP[size] || MAX_WIDTH_MAP.md
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-[#0F172A]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-[#64748B]">{description}</p>
            )}
          </div>
          {!preventClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-md p-1.5 text-[#64748B] transition-colors hover:bg-slate-100 hover:text-[#0F172A]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-[#E2E8F0] bg-slate-50/70 px-6 py-3.5 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;

