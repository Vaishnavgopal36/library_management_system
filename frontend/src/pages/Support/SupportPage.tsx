import React, { useState } from 'react';
import styles from './SupportPage.module.css';
import { AppShell } from '../../components/layouts/AppShell/AppShell';

export interface SupportPageProps {
  role?: 'admin' | 'member';
}

interface StepItem {
  title: string;
  steps: string[];
}

// ── Admin guide ────────────────────────────────────────────────────────────────
const ADMIN_GUIDE: { category: string; icon: React.ReactNode; items: StepItem[] }[] = [
  {
    category: 'Getting Started',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
    items: [
      {
        title: 'Logging in as Administrator',
        steps: [
          'Navigate to the login page and enter your admin credentials.',
          'You will be directed to the Admin Dashboard which gives an overview of loans, fines and member activity.',
          'The sidebar gives you access to all admin-only sections including Transaction Ledger, Members, Fines and Reservations.',
        ],
      },
    ],
  },
  {
    category: 'Managing Books',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    items: [
      {
        title: 'Searching the Catalogue',
        steps: [
          'Go to the Search section from the sidebar.',
          'Use the top search bar to find books by title, author or ISBN.',
          'Each result shows availability, current holder (if borrowed) and reservation queue length.',
        ],
      },
      {
        title: 'Issuing a Book to a Member',
        steps: [
          'Search for the book and open its detail view.',
          'Use the "Issue to Member" action and select the member from the directory.',
          'Confirm the transaction — it will appear immediately in the Transaction Ledger.',
        ],
      },
      {
        title: 'Processing a Return',
        steps: [
          'Navigate to Transaction Ledger and locate the active loan.',
          'Click "Mark as Returned". The system will automatically calculate any overdue fine.',
          'Confirm the return. The fine (if any) will appear on the member\'s account.',
        ],
      },
    ],
  },
  {
    category: 'Managing Members',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    items: [
      {
        title: 'Viewing the Member Directory',
        steps: [
          'Open the Members section from the sidebar (admin only).',
          'Use the toggle pill to switch between Active and Blacklisted members.',
          'Search by name or email using the top search bar.',
        ],
      },
      {
        title: 'Blacklisting / Reinstating a Member',
        steps: [
          'Find the member in the directory.',
          'Click the coloured status pill in their row to toggle status between Active and Blacklisted.',
          'Blacklisted members are immediately prevented from borrowing or making new reservations.',
          'Reinstate by clicking the status pill again once all obligations are resolved.',
        ],
      },
      {
        title: 'Editing Member Details',
        steps: [
          'Click the edit (pencil) icon on the member\'s row.',
          'You may update the member\'s displayed name and email address.',
          'Member IDs, department and phone details are self-managed by the member for privacy.',
        ],
      },
      {
        title: 'Removing a Member',
        steps: [
          'Click the delete (bin) icon on the member\'s row.',
          'A confirmation dialog will appear — review the member name carefully before confirming.',
          'Deletion is permanent and cannot be undone through the interface.',
        ],
      },
    ],
  },
  {
    category: 'Fines & Payments',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    items: [
      {
        title: 'Reviewing Outstanding Fines',
        steps: [
          'Go to Fines & Payments in the sidebar.',
          'Use the filter chips to view Unpaid fines or all settled transactions.',
          'The danger chip at the top shows the total outstanding balance across all members.',
        ],
      },
      {
        title: 'Marking a Fine as Settled',
        steps: [
          'Locate the fine record for the relevant member.',
          'Click "Mark as Paid" once payment has been received.',
          'The record moves to Settled and the member\'s account balance updates immediately.',
        ],
      },
    ],
  },
  {
    category: 'Reservations',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    items: [
      {
        title: 'Managing the Reservation Queue',
        steps: [
          'Open the Reservations page to see all active, pending, ready, expired and cancelled reservations.',
          'Use the filter chips to focus on a specific status.',
          'When a reserved book becomes available, mark it as "Ready for Collection" to notify the member.',
          'If the member does not collect within the hold window, expire the reservation so the book re-enters circulation.',
        ],
      },
    ],
  },
];

// ── Member guide ───────────────────────────────────────────────────────────────
const MEMBER_GUIDE: { category: string; icon: React.ReactNode; items: StepItem[] }[] = [
  {
    category: 'Getting Started',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
    items: [
      {
        title: 'Creating Your Account',
        steps: [
          'Visit the Register page and enter your full name and email address.',
          'That\'s all — no additional personal information is collected.',
          'Log in with your credentials to access the library portal.',
        ],
      },
      {
        title: 'Navigating the Dashboard',
        steps: [
          'After logging in you land on your personal Dashboard with a snapshot of active loans, upcoming due dates and outstanding fines.',
          'Use the sidebar to jump to any section: Search, History, Fines, Reservations or your Profile.',
          'Click your name or avatar in the top-right corner to view your full Profile page.',
        ],
      },
    ],
  },
  {
    category: 'Finding & Borrowing Books',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    items: [
      {
        title: 'Searching the Catalogue',
        steps: [
          'Click Search in the sidebar to open the book catalogue.',
          'Type a title, author name or ISBN into the top search bar.',
          'Results update as you type and show availability at a glance.',
        ],
      },
      {
        title: 'Borrowing a Book',
        steps: [
          'From the search results, open the book you want.',
          'If available, click "Borrow". The book is added to your active loans immediately.',
          'You can hold a maximum of 5 books at any one time.',
          'Your loan period is 14 days from the borrow date.',
        ],
      },
      {
        title: 'Renewing a Loan',
        steps: [
          'Go to My History and find the active loan.',
          'Click "Renew" — you can do this up to 2 times per item.',
          'Renewal is not available if another member has reserved that book.',
        ],
      },
    ],
  },
  {
    category: 'Reservations',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    items: [
      {
        title: 'Reserving an Unavailable Book',
        steps: [
          'From the search results, click on a book that shows as "On Loan".',
          'Click "Reserve". You are added to the queue in the order you reserved.',
          'You may have up to 3 active reservations at any time.',
        ],
      },
      {
        title: 'Checking Your Reservations',
        steps: [
          'Go to the Reservations page to see all your pending and ready bookings.',
          'Filter by status: Pending, Ready, Expired or Cancelled using the chips at the top.',
          'When a book is ready for collection, its chip changes to "Ready" and the expiry date is shown.',
        ],
      },
      {
        title: 'Cancelling a Reservation',
        steps: [
          'Find the reservation you want to cancel on the Reservations page.',
          'Click "Cancel Reservation". No fee is charged for cancellations.',
        ],
      },
    ],
  },
  {
    category: 'History & Fines',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    items: [
      {
        title: 'Viewing My Borrowing History',
        steps: [
          'Go to My History in the sidebar.',
          'Filter by status chips: All, Active, Overdue, Returned or Reserved.',
          'Each row shows the book, borrow date, due date and current status.',
        ],
      },
      {
        title: 'Understanding & Paying Fines',
        steps: [
          'Open Fines & Payments in the sidebar.',
          'Unpaid fines show the daily rate, number of overdue days and total amount owed.',
          'Click "Pay Fine" to settle the balance. A receipt is generated and the record moves to Settled.',
          'Maintaining a zero balance keeps your account fully active and eligible for new borrowings.',
        ],
      },
    ],
  },
  {
    category: 'Profile & Account',
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    items: [
      {
        title: 'Viewing Your Profile',
        steps: [
          'Click your name or avatar in the top-right corner.',
          'Your profile shows your account summary, statistics and any earned badges.',
          'Badges are awarded for milestones such as borrowing activity, on-time returns and active membership.',
        ],
      },
    ],
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function GuideSection({
  category,
  icon,
  items,
}: {
  category: string;
  icon: React.ReactNode;
  items: StepItem[];
}) {
  return (
    <div className={styles.guideSection}>
      <div className={styles.categoryHeader}>
        <div className={styles.categoryIcon}>{icon}</div>
        <h2 className={styles.categoryTitle}>{category}</h2>
      </div>
      <div className={styles.itemsCol}>
        {items.map(item => (
          <div key={item.title} className={styles.itemCard}>
            <h3 className={styles.itemTitle}>{item.title}</h3>
            <ol className={styles.stepList}>
              {item.steps.map((step, i) => (
                <li key={i} className={styles.stepItem}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepText}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupportPage({ role = 'member' }: SupportPageProps) {
  const guide = role === 'admin' ? ADMIN_GUIDE : MEMBER_GUIDE;
  const isAdmin = role === 'admin';

  return (
    <AppShell
      userName={isAdmin ? 'System Admin' : 'Reinhard Kenson'}
      activeNavItem="Support/Help"
      role={role}
    >
      <div className={styles.pageContainer}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={`${styles.heroIcon} ${isAdmin ? styles.heroIconAdmin : styles.heroIconMember}`}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h1 className={styles.heroTitle}>
              {isAdmin ? 'Admin Help Centre' : 'Member Help Centre'}
            </h1>
            <p className={styles.heroSub}>
              {isAdmin
                ? 'Step-by-step guides for managing books, members, transactions, fines and reservations.'
                : 'Step-by-step guides for searching, borrowing, reserving books and managing your account.'}
            </p>
          </div>
        </div>

        {/* Role indicator */}
        <div className={`${styles.roleBanner} ${isAdmin ? styles.roleBannerAdmin : styles.roleBannerMember}`}>
          <span className={styles.roleLabel}>{isAdmin ? 'Administrator Guide' : 'Member Guide'}</span>
          <span className={styles.roleNote}>
            {isAdmin ? 'This guide is for admins only. Members see a different version of this page.' : 'This guide is personalised for members. Admins see a different version of this page.'}
          </span>
        </div>

        {/* Guide sections */}
        <div className={styles.guideList}>
          {guide.map(g => (
            <GuideSection key={g.category} category={g.category} icon={g.icon} items={g.items} />
          ))}
        </div>

        {/* Contact footer */}
        <div className={styles.contactCard}>
          <div className={styles.contactIcon}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9b2c5e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div>
            <p className={styles.contactTitle}>Still need help?</p>
            <p className={styles.contactBody}>
              Contact the library administration at <strong>support@bookstop.lib</strong>. We aim to respond within one business day.
            </p>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
