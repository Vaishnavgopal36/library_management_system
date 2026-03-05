import React from 'react';
import { AppRole } from '../../utils/types';
import styles from './ProfilePage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Mock profile data ─────────────────────────────────────────────────────────
const memberProfile = {
  name: 'Reinhard Kenson',
  email: 'reinhard@university.edu',
  memberId: 'MBR-042',
  department: 'Computer Science',
  phone: '+91 91234 56789',
  joined: '15 Aug 2024',
  avatarInitials: 'RK',
  stats: [
    { label: 'Books Borrowed', value: '12' },
    { label: 'Currently Active', value: '2' },
    { label: 'Fines Paid', value: '₹80' },
    { label: 'Reservations', value: '2' },
  ],
  badges: [
    {
      label: 'Active Member',
      color: '#065f46',
      bg: '#d1fae5',
      border: '#6ee7b7',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      ),
      description: 'Account is in good standing',
    },
    {
      label: 'Bookworm',
      color: '#1e40af',
      bg: '#dbeafe',
      border: '#93c5fd',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      ),
      description: 'Borrowed 10+ books',
    },
    {
      label: 'Reserved Pro',
      color: '#5b21b6',
      bg: '#ede9fe',
      border: '#c4b5fd',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ),
      description: 'Made 2+ reservations',
    },
  ] as BadgeInfo[],
};

const adminProfile = {
  name: 'System Admin',
  email: 'admin@bookstop.lib',
  memberId: 'ADM-001',
  department: 'Library Administration',
  phone: '+91 98765 43210',
  joined: '01 Jan 2024',
  avatarInitials: 'SA',
  stats: [
    { label: 'Total Members', value: '128' },
    { label: 'Active Loans', value: '348' },
    { label: 'Fines Collected', value: '₹4,250' },
    { label: 'New This Month', value: '14' },
  ],
  badges: [
    {
      label: 'System Administrator',
      color: '#991b1b',
      bg: '#fee2e2',
      border: '#fca5a5',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      ),
      description: 'Full system access & management',
    },
    {
      label: 'Library Manager',
      color: '#5b21b6',
      bg: '#ede9fe',
      border: '#c4b5fd',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      ),
      description: 'Manages circulation & inventory',
    },
    {
      label: 'Super User',
      color: '#92400e',
      bg: '#fef3c7',
      border: '#fcd34d',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      ),
      description: 'All-access elevated privilege',
    },
  ] as BadgeInfo[],
};

// ── Component ─────────────────────────────────────────────────────────────────
export const ProfilePage: React.FC<ProfilePageProps> = ({ role = 'member' }) => {
  const isAdmin = role === 'admin';
  const profile = isAdmin ? adminProfile : memberProfile;

  return (
    <AppShell
      userName={isAdmin ? 'System Admin' : 'Rick'}
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
                {profile.avatarInitials}
              </div>
            </div>
            <div className={styles.heroMeta}>
              <h2 className={styles.heroName}>{profile.name}</h2>
              <span className={`${styles.rolePill} ${isAdmin ? styles.rolePillAdmin : styles.rolePillMember}`}>
                {isAdmin ? 'Administrator' : 'Library Member'}
              </span>
              <p className={styles.heroId}>ID: {profile.memberId}</p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className={styles.columns}>

          {/* Left: Details */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Personal Details</h3>
            <div className={styles.detailList}>
              <DetailRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              } label="Full Name" value={profile.name} />
              <DetailRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              } label="Email" value={profile.email} />
              <DetailRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18z"/></svg>
              } label="Phone" value={profile.phone} />
              <DetailRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              } label="Department" value={profile.department} />
              <DetailRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              } label="Member Since" value={profile.joined} />
              <DetailRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              } label={isAdmin ? 'Admin ID' : 'Member ID'} value={profile.memberId} />
            </div>
          </div>

          {/* Right: Stats + Badges */}
          <div className={styles.rightCol}>

            {/* Stats */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>{isAdmin ? 'System Overview' : 'Activity Summary'}</h3>
              <div className={styles.statsGrid}>
                {profile.stats.map((s) => (
                  <div key={s.label} className={styles.statCell}>
                    <span className={styles.statValue}>{s.value}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Earned Badges
              </h3>
              <div className={styles.badgeList}>
                {profile.badges.map((b) => (
                  <div
                    key={b.label}
                    className={styles.badgeCard}
                    style={{ borderColor: b.border, backgroundColor: b.bg }}
                  >
                    <div className={styles.badgeIcon} style={{ color: b.color }}>
                      {b.icon}
                    </div>
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
const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className={styles.detailRow}>
    <span className={styles.detailIcon}>{icon}</span>
    <span className={styles.detailLabel}>{label}</span>
    <span className={styles.detailValue}>{value}</span>
  </div>
);
