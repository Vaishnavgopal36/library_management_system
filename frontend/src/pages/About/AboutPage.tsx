import React from 'react';
import { AppRole } from '../../utils/types';
import styles from './AboutPage.module.css';
import { Icon } from '../../components/atoms/Icon';
import { AppShell } from '../../layouts/AppShell/AppShell';

export interface AboutPageProps {
  role?: AppRole;
}

const FEATURES = [
  {
    icon: <Icon name="search" size={24} />,
    title: 'Smart Search',
    desc: 'Find any book instantly by title, author, genre or ISBN. Filters narrow results to exactly what you need.',
  },
  {
    icon: <Icon name="book-open" size={24} />,
    title: 'Borrow & Return',
    desc: 'Borrow up to 5 books per cycle with a 14-day loan period. Return tracking handled automatically.',
  },
  {
    icon: <Icon name="calendar" size={24} />,
    title: 'Reservations',
    desc: 'Reserve books currently on loan. Get notified when they become available and hold them for up to 3 days.',
  },
  {
    icon: <Icon name="clock" size={24} />,
    title: 'Full History',
    desc: 'Every transaction is logged — borrowings, returns, renewals and reservations — so nothing gets lost.',
  },
  {
    icon: <Icon name="credit-card" size={24} />,
    title: 'Fines & Payments',
    desc: 'Transparent overdue fine tracking with a clear breakdown. Settle fines directly through the platform.',
  },
  {
    icon: <Icon name="users" size={24} />,
    title: 'Member Management',
    desc: 'Administrators maintain a live member directory, manage account standing and monitor borrowing activity.',
  },
];

const COLLECTION_CATEGORIES = [
  { label: 'Fiction & Literature', count: '1,200+', color: 'var(--color-brand)', bg: 'var(--color-brand-light)' },
  { label: 'Science & Technology', count: '980+', color: 'var(--color-info-800)', bg: 'var(--color-info-50)' },
  { label: 'Academic & Research', count: '2,400+', color: 'var(--color-success-900)', bg: 'var(--color-success-50)' },
  { label: 'Arts & Humanities', count: '760+', color: 'var(--color-warning-800)', bg: 'var(--color-warning-50)' },
  { label: 'Business & Finance', count: '540+', color: 'var(--color-violet-800)', bg: 'var(--color-violet-50)' },
  { label: 'History & Biography', count: '650+', color: 'var(--color-cyan-800)', bg: 'var(--color-cyan-50)' },
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
              <Icon name="book-open" size={32} stroke="white" />
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
