import React, { useState } from 'react';
import { AppRole } from '../../utils/types';
import styles from './TermsPage.module.css';
import { Icon } from '../../components/atoms/Icon';
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
    icon: <Icon name="user" size={20} />,
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
    icon: <Icon name="book-open" size={20} />,
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
    icon: <Icon name="credit-card" size={20} />,
    rules: [
      { heading: 'Overdue fine rate', body: 'A daily fine of ₹2 per item is applied for each calendar day a book remains unreturned after its due date, including weekends and public holidays.' },
      { heading: 'Fine accumulation', body: 'Fines accumulate automatically. The outstanding amount is visible in the Fines & Payments section of your account at any time.' },
      { heading: 'Borrowing suspension', body: 'If your outstanding fine balance reaches ₹500 or more, new borrowings are suspended until the balance is cleared.' },
      { heading: 'Fine settlement', body: 'Fines are settled through the Fines & Payments page. A receipt is generated and your payment history is retained for your records.' },
    ],
  },
  {
    id: 'reservations',
    title: 'Reservations',
    icon: <Icon name="calendar" size={20} />,
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
    icon: <Icon name="slash" size={20} />,
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
    icon: <Icon name="check-square" size={20} />,
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
          <Icon name="info" size={18} stroke="var(--color-brand)" />
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
                <Icon
                  name="chevron-down"
                  className={`${styles.chevron} ${expanded === section.id ? styles.chevronUp : ''}`}
                  size={18}
                  strokeWidth={2.5}
                />
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
