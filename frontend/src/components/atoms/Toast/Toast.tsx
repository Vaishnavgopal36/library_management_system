import React, { useEffect } from 'react';
import styles from './Toast.module.css';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  variant?: 'success' | 'error' | 'info';
  onClose?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  onClose,
  duration = 3000,
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (!onClose || duration <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [duration, onClose]);

  const toastClasses = [
    styles.toast,
    styles[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={toastClasses} role="alert" {...props}>
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};
