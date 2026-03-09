import React, { useEffect, useState } from 'react';
import { AppRole } from '../../utils/types';
import styles from './ProfilePage.module.css';
import { Icon } from '../../components/atoms/Icon';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { useAuth } from '../../context/AuthContext';
import { reportService, type SystemAnalytics } from '../../services/report.service';
import { transactionService } from '../../services/transaction.service';
import { fineService } from '../../services/fine.service';
import { reservationService } from '../../services/reservation.service';

export interface ProfilePageProps {
  role?: AppRole;
}

interface BadgeInfo {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  description: string;
}

// ── Static badge definitions (cosmetic — role-based) ─────────────────────────
const ADMIN_BADGES: BadgeInfo[] = [
  {
    label: 'System Administrator',
    color: 'var(--color-danger-800)', bg: 'var(--color-danger-100)', border: 'var(--color-danger-300)',
    icon: <Icon name="settings" size={16} />,
    description: 'Full system access & management',
  },
  {
    label: 'Library Manager',
    color: 'var(--color-violet-800)', bg: 'var(--color-violet-100)', border: 'var(--color-violet-300)',
    icon: <Icon name="book-open" size={16} />,
    description: 'Manages circulation & inventory',
  },
];

const MEMBER_BADGES: BadgeInfo[] = [
  {
    label: 'Active Member',
    color: 'var(--color-success-900)', bg: 'var(--color-success-200)', border: 'var(--color-success-300)',
    icon: <Icon name="check" size={16} strokeWidth={2.5} />,
    description: 'Account is in good standing',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const ProfilePage: React.FC<ProfilePageProps> = ({ role = 'member' }) => {
  const { user } = useAuth();
  const isAdmin = role === 'admin';

  // ── Stats from API ──────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [txCount, setTxCount] = useState<number | null>(null);
  const [activeLoans, setActiveLoans] = useState<number | null>(null);
  const [unpaidFines, setUnpaidFines] = useState<number | null>(null);
  const [reservationCount, setReservationCount] = useState<number | null>(null);

  useEffect(() => {
    if (isAdmin) {
      reportService.getAnalytics().then(setAnalytics).catch(console.error);
    } else {
      transactionService.list()
        .then(txs => {
          setTxCount(txs.length);
          setActiveLoans(txs.filter(t => t.status === 'issued' || t.status === 'overdue').length);
        })
        .catch(console.error);
      fineService.list({ isPaid: false })
        .then(fines => setUnpaidFines(fines.reduce((sum, f) => sum + f.amount, 0)))
        .catch(console.error);
      reservationService.list()
        .then(res => setReservationCount(res.filter(r => r.status === 'active').length))
        .catch(console.error);
    }
  }, [isAdmin]);

  const fmt = (n: number | null) => n == null ? '—' : String(n);

  const adminStats = [
    { label: 'Total Books', value: analytics != null ? String(analytics.totalActiveBooks) : '—' },
    { label: 'Active Loans', value: analytics != null ? String(analytics.currentlyIssuedBooks) : '—' },
    { label: 'Active Members', value: analytics != null ? String(analytics.totalActiveUsers) : '—' },
    { label: 'Unpaid Fines (₹)', value: analytics != null ? String(Number(analytics.totalUnpaidFinesValue)) : '—' },
  ];

  const memberStats = [
    { label: 'Total Borrowed', value: fmt(txCount) },
    { label: 'Active Loans', value: fmt(activeLoans) },
    { label: 'Unpaid Fines (₹)', value: fmt(unpaidFines) },
    { label: 'Active Holds', value: fmt(reservationCount) },
  ];

  const stats = isAdmin ? adminStats : memberStats;
  const badges = isAdmin ? ADMIN_BADGES : MEMBER_BADGES;
  const avatarInitials = user?.fullName
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <AppShell
      userName={user?.fullName ?? (isAdmin ? 'Admin' : 'Member')}
      activeNavItem="Profile"
      role={role}
    >
      <div className={styles.pageContainer}>

        {/* ── Hero card ── */}
        <div className={styles.heroCard}>
          <div className={styles.heroBg} />
          <div className={styles.heroBody}>
            <div className={styles.avatarWrap}>
              <div className={`${styles.bigAvatar} ${isAdmin ? styles.bigAvatarAdmin : styles.bigAvatarMember}`}>
                {avatarInitials}
              </div>
            </div>
            <div className={styles.heroMeta}>
              <h2 className={styles.heroName}>{user?.fullName ?? '—'}</h2>
              <span className={`${styles.rolePill} ${isAdmin ? styles.rolePillAdmin : styles.rolePillMember}`}>
                {isAdmin ? 'Administrator' : 'Library Member'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className={styles.columns}>

          {/* Left: Details */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Account Details</h3>
            <div className={styles.detailList}>
              <DetailRow
              icon={<Icon name="user" size={16} />}
                label="Full Name"
                value={user?.fullName ?? '—'}
              />
              <DetailRow
              icon={<Icon name="mail" size={16} />}
                label="Email"
                value={user?.email ?? '—'}
              />
              <DetailRow
              icon={<Icon name="lock" size={16} />}
                label="Role"
                value={isAdmin ? 'Administrator' : 'Member'}
              />
            </div>
          </div>

          {/* Right: Stats + Badges */}
          <div className={styles.rightCol}>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>{isAdmin ? 'System Overview' : 'Activity Summary'}</h3>
              <div className={styles.statsGrid}>
                {stats.map(s => (
                  <div key={s.label} className={styles.statCell}>
                    <span className={styles.statValue}>{s.value}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <Icon name="star" size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Earned Badges
              </h3>
              <div className={styles.badgeList}>
                {badges.map(b => (
                  <div key={b.label} className={styles.badgeCard} style={{ borderColor: b.border, backgroundColor: b.bg }}>
                    <div className={styles.badgeIcon} style={{ color: b.color }}>{b.icon}</div>
                    <div className={styles.badgeInfo}>
                      <span className={styles.badgeLabel} style={{ color: b.color }}>{b.label}</span>
                      <span className={styles.badgeDesc}>{b.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </AppShell>
  );
};

// ── Helper component ──────────────────────────────────────────────────────────
const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className={styles.detailRow}>
    <span className={styles.detailIcon}>{icon}</span>
    <span className={styles.detailLabel}>{label}</span>
    <span className={styles.detailValue}>{value}</span>
  </div>
);
