import React from 'react';
import styles from './AboutPage.module.css';
import { AppShell } from '../../components/layouts/AppShell/AppShell';

export interface AboutPageProps {
  role?: 'admin' | 'member';
}

const FEATURES = [
  {
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: 'Smart Search',
    desc: 'Find any book instantly by title, author, genre or ISBN. Filters narrow results to exactly what you need.',
  },
  {
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    title: 'Borrow & Return',
    desc: 'Borrow up to 5 books per cycle with a 14-day loan period. Return tracking handled automatically.',
  },
  {
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Reservations',
    desc: 'Reserve books currently on loan. Get notified when they become available and hold them for up to 3 days.',
  },
  {
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Full History',
    desc: 'Every transaction is logged — borrowings, returns, renewals and reservations — so nothing gets lost.',
  },
  {
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    title: 'Fines & Payments',
    desc: 'Transparent overdue fine tracking with a clear breakdown. Settle fines directly through the platform.',
  },
  {
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Member Management',
    desc: 'Administrators maintain a live member directory, manage account standing and monitor borrowing activity.',
  },
];

const COLLECTION_CATEGORIES = [
  { label: 'Fiction & Literature', count: '1,200+', color: '#9b2c5e', bg: '#fdf2f8' },
  { label: 'Science & Technology', count: '980+', color: '#1e40af', bg: '#eff6ff' },
  { label: 'Academic & Research', count: '2,400+', color: '#065f46', bg: '#ecfdf5' },
  { label: 'Arts & Humanities', count: '760+', color: '#92400e', bg: '#fffbeb' },
  { label: 'Business & Finance', count: '540+', color: '#5b21b6', bg: '#f5f3ff' },
  { label: 'History & Biography', count: '650+', color: '#155e75', bg: '#ecfeff' },
];

const STATS = [
  { value: '6,500+', label: 'Titles Available' },
  { value: '128', label: 'Registered Members' },
  { value: '12', label: 'Subject Categories' },
  { value: '99.2%', label: 'Uptime' },
];

export function AboutPage({ role = 'member' }: AboutPageProps) {
  return (
    <AppShell userName={role === 'admin' ? 'System Admin' : 'Reinhard Kenson'} activeNavItem="About" role={role}>
      <div className={styles.pageContainer}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroBg} />
          <div className={styles.heroContent}>
            <div className={styles.logoMark}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h1 className={styles.heroTitle}>BookStop Library</h1>
            <p className={styles.heroSub}>
              Your digital gateway to a world of knowledge. Browse, borrow, reserve and manage your reading journey — all in one place.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className={styles.statsStrip}>
          {STATS.map(s => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Features */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What You Can Do</h2>
          <p className={styles.sectionSub}>Everything you need to make the most of the library, built into a single streamlined experience.</p>
          <div className={styles.featuresGrid}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Collection */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Collection</h2>
          <p className={styles.sectionSub}>Over 6,500 curated titles across 12 subject areas, continuously updated with new acquisitions.</p>
          <div className={styles.collectionGrid}>
            {COLLECTION_CATEGORIES.map(c => (
              <div key={c.label} className={styles.collectionCard} style={{ background: c.bg, borderColor: `${c.color}33` }}>
                <span className={styles.collectionCount} style={{ color: c.color }}>{c.count}</span>
                <span className={styles.collectionLabel}>{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsRow}>
            {[
              { step: '1', title: 'Register', desc: 'Create your account with just your name and email. No extra personal information required.' },
              { step: '2', title: 'Discover', desc: 'Search the full catalogue by title, author or subject. View availability in real time.' },
              { step: '3', title: 'Borrow', desc: 'Borrow up to 5 titles per cycle. Use the reservation system to queue up popular books.' },
              { step: '4', title: 'Return & Renew', desc: 'Return on time to keep your account in good standing, or renew if you need more time.' },
            ].map(s => (
              <div key={s.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{s.step}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  );
}
