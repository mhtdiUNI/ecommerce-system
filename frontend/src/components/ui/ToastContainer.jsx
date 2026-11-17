import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { subscribe, getToasts, dismissToast } from '../../services/toastStore';

const ICONS = { success: CheckCircle, error: XCircle, info: Info };

function ToastContainer() {
  const [toasts, setToasts] = useState(getToasts());

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon size={18} />
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
