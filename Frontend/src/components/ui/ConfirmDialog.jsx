import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      preventClose={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            variant === 'danger'
              ? 'bg-red-50 text-[#DC2626]'
              : 'bg-[#CCFBF1] text-[#0F766E]'
          }`}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-[#1E293B]">{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;

