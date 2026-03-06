import React, { useState } from 'react';
import { AppRole } from '../../utils/types';
import styles from './TermsPage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';

export interface TermsPageProps {
  role?: AppRole;
}

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  rules: { heading: string; body: string }[];
}

const SECTIONS: Section[] = [
  {
    id: 'membership',
    title: 'Membership & Accounts',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    rules: [
      { heading: 'One account per person', body: 'Each individual may hold only one active library account at any time. Duplicate accounts are subject to removal.' },
      { heading: 'Valid email required', body: 'A working email address is required for account verification, loan notifications and overdue reminders.' },
      { heading: 'Account responsibility', body: 'Members are responsible for all activity that occurs under their account. Sharing account credentials is not permitted.' },
      { heading: 'Privacy of information', body: 'We collect only your name and email address. No additional personal details are stored or shared with third parties.' },
    ],
  },
  {
    id: 'borrowing',
    title: 'Borrowing Rules',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    rules: [
      { heading: 'Borrowing limit', body: 'A maximum of 5 books may be held at any one time. Borrowing a 6th item requires that an existing loan be returned first.' },
      { heading: 'Standard loan period', body: 'Each book is lent for 14 calendar days from the date of issue. The due date is shown in your borrowing history.' },
      { heading: 'Renewals', body: 'A loan may be renewed up to 2 times, as long as no other member has placed a reservation on that item. Each renewal extends the loan by 14 days.' },
      { heading: 'Condition of items', body: 'Members are responsible for returning items in the same condition they were issued. Damage beyond normal wear may attract a replacement charge.' },
    ],
  },
  {
    id: 'fines',
    title: 'Fines & Overdue Policy',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    rules: [
      { heading: 'Overdue fine rate', body: 'A daily fine of ₹5 per item is applied for each calendar day a book remains unreturned after its due date, including weekends and public holidays.' },
      { heading: 'Fine accumulation', body: 'Fines accumulate automatically. The outstanding amount is visible in the Fines & Payments section of your account at any time.' },
      { heading: 'Borrowing suspension', body: 'If your outstanding fine balance reaches ₹500 or more, new borrowings are suspended until the balance is cleared.' },
      { heading: 'Fine settlement', body: 'Fines are settled through the Fines & Payments page. A receipt is generated and your payment history is retained for your records.' },
    ],
  },
  {
    id: 'reservations',
    title: 'Reservations',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    rules: [
      { heading: 'Reservation limit', body: 'A maximum of 3 reservations may be active at any one time, covering books that are currently on loan to another member.' },
      { heading: 'Hold window', body: 'When a reserved item becomes available, it is held exclusively for you for 3 calendar days. If not collected within this window, the reservation expires and the item is returned to open circulation.' },
      { heading: 'Cancellation', body: 'You may cancel a pending reservation at any time from the Reservations page. Expired or cancelled reservations do not incur any charge.' },
      { heading: 'Queue position', body: 'Reservations are fulfilled in the order they were placed. Your queue position is shown in the Reservations page.' },
    ],
  },
  {
    id: 'blacklisting',
    title: 'Account Restrictions & Blacklisting',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    rules: [
      { heading: 'Blacklisting criteria', body: 'An account may be blacklisted if 3 or more items are overdue simultaneously, the outstanding fine balance exceeds ₹500, or if there is evidence of account misuse.' },
      { heading: 'Effect of blacklisting', body: 'A blacklisted account cannot borrow new items or place reservations. Existing loans must be returned and fines cleared before the restriction can be lifted.' },
      { heading: 'Reinstatement', body: 'Submit a reinstatement request to the library administration once all obligations are met. Accounts are reviewed and reinstated at the discretion of the librarian.' },
      { heading: 'Notification', body: 'Members are notified by email when their account is restricted or reinstated.' },
    ],
  },
  {
    id: 'conduct',
    title: 'Acceptable Use',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    rules: [
      { heading: 'Intended use', body: 'This platform is provided for the sole purpose of accessing library services. Commercial use, scraping or automated querying is prohibited.' },
      { heading: 'Respectful conduct', body: 'Members are expected to interact with the platform and its staff in a respectful manner. Abusive behaviour is grounds for account suspension.' },
      { heading: 'Reporting issues', body: 'If you notice an error in your records, a missing transaction or an incorrectly applied fine, contact the library administration through the Support page.' },
      { heading: 'Policy updates', body: 'These terms may be updated periodically. Continued use of the platform following any update constitutes acceptance of the revised terms.' },
    ],
  },
];

export function TermsPage({ role = 'member' }: TermsPageProps) {
  const [expanded, setExpanded] = useState<string | null>('membership');

  const toggle = (id: string) => setExpanded(prev => (prev === id ? null : id));

  return (
    <AppShell userName={role === 'admin' ? 'System Admin' : 'Reinhard Kenson'} activeNavItem="Terms & Condition" role={role}>
      <div className={styles.pageContainer}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Terms &amp; Conditions</h1>
          <p className={styles.pageSubtitle}>
            Last updated: 5 March 2026 &nbsp;·&nbsp; These rules govern the use of BookStop Library services for all members and administrators.
          </p>
        </div>

        {/* Notice banner */}
        <div className={styles.noticeBanner}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>By using BookStop you agree to abide by the policies below. Rules are enforced consistently to ensure fair access for all members.</span>
        </div>

        {/* Accordion sections */}
        <div className={styles.accordion}>
          {SECTIONS.map(section => (
            <div key={section.id} className={`${styles.accordionItem} ${expanded === section.id ? styles.accordionOpen : ''}`}>
              <button className={styles.accordionHeader} onClick={() => toggle(section.id)}>
                <div className={styles.accordionLeft}>
                  <div className={styles.accordionIcon}>{section.icon}</div>
                  <span className={styles.accordionTitle}>{section.title}</span>
                </div>
                <svg
                  className={`${styles.chevron} ${expanded === section.id ? styles.chevronUp : ''}`}
                  width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expanded === section.id && (
                <div className={styles.accordionBody}>
                  {section.rules.map(rule => (
                    <div key={rule.heading} className={styles.ruleRow}>
                      <div className={styles.ruleDot} />
                      <div>
                        <span className={styles.ruleHeading}>{rule.heading} — </span>
                        <span className={styles.ruleBody}>{rule.body}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className={styles.footerNote}>
          For questions about these terms, please contact the library administration via the <strong>Support &amp; Help</strong> page.
        </p>

      </div>
    </AppShell>
  );
}
