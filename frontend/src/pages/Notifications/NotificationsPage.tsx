import React, { useCallback, useEffect, useState } from 'react';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Icon } from '../../components/atoms/Icon';
import { notificationService, type ApiNotification } from '../../services/notification.service';
import { AppRole } from '../../utils/types';
import styles from './NotificationsPage.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
function typeLabel(type: string): string {
  switch (type) {
    case 'book_issued':  return 'Book Issued';
    case 'fine_accrual': return 'Fine';
    case 'fine_settlement': return 'Fine Settled';
    case 'admin_notice': return 'Admin Notice';
    default:             return 'System';
  }
}

function typeClass(type: string): string {
  switch (type) {
    case 'book_issued':  return styles.tagBlue;
    case 'fine_accrual': return styles.tagRed;
    case 'fine_settlement': return styles.tagGreen;
    case 'admin_notice': return styles.tagPurple;
    default:             return styles.tagGray;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export interface NotificationsPageProps {
  role?: AppRole;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ role = 'member' }) => {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    notificationService
      .fetch()
      .then(({ notifications }) => setNotifications(notifications))
      .catch((e) => setError(e?.message ?? 'Failed to load notifications.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell role={role}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Notifications</h1>
            {unreadCount > 0 && (
              <span className={styles.unreadLabel}>{unreadCount} unread</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className={styles.markAllBtn}
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? 'Marking…' : 'Mark all as read'}
            </button>
          )}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className={styles.stateBox}>Loading…</div>
        ) : error ? (
          <div className={`${styles.stateBox} ${styles.errorBox}`}>{error}</div>
        ) : notifications.length === 0 ? (
          <div className={styles.stateBox}>
            <Icon name="bell" size={40} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
            <p>You're all caught up!</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`${styles.item} ${n.isRead ? styles.itemRead : styles.itemUnread}`}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                tabIndex={n.isRead ? -1 : 0}
                role={n.isRead ? undefined : 'button'}
                aria-label={n.isRead ? undefined : 'Mark as read'}
                onKeyDown={(e) => !n.isRead && e.key === 'Enter' && handleMarkRead(n.id)}
              >
                <div className={styles.itemLeft}>
                  {!n.isRead && <span className={styles.unreadDot} />}
                  <span className={`${styles.tag} ${typeClass(n.type)}`}>
                    {typeLabel(n.type)}
                  </span>
                  <p className={styles.message}>{n.message}</p>
                </div>
                <div className={styles.itemRight}>
                  <span className={styles.timestamp}>{formatDate(n.createdAt)}</span>
                  {!n.isRead && (
                    <button
                      className={styles.readBtn}
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                      aria-label="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
};
