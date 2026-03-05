import React, { useState, useEffect, useMemo } from 'react';
import styles from './MemberDirectoryPage.module.css';
import { AppShell } from '../../components/layouts/AppShell/AppShell';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';

// ── Types ─────────────────────────────────────────────────────────────────────
// Derived display status: isActive=true → 'Active', isActive=false → 'Blacklisted'
export type MemberStatus = 'Active' | 'Blacklisted';

export interface MemberBadge {
  label: string;
  color: string;
  bg: string;
  border: string;
}

// Matches API UserResponse fields (+ UI-only aggregate helpers)
export interface Member {
  // API UserResponse fields:
  id: string;                      // UUID (was: number)
  email: string;
  fullName: string;                // was: name
  role: 'admin' | 'member';
  isActive: boolean;               // was: status ('Active'/'Blacklisted')
  // ── UI-only fields (require additional API queries) ─────────────────────────
  // booksActive: derived from GET /api/v1/transaction?userId&status=Issued
  // finesOwed:   derived from GET /api/v1/fine?userId&isPaid=false
  booksActive: number;
  finesOwed: number;
  badges: MemberBadge[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const ACTIVE_BADGE: MemberBadge = {
  label: 'Active Member',
  color: '#065f46',
  bg: '#d1fae5',
  border: '#6ee7b7',
};

const BLACKLISTED_BADGE: MemberBadge = {
  label: 'Blacklisted',
  color: '#991b1b',
  bg: '#fee2e2',
  border: '#fca5a5',
};

// Mock data matches UserResponse field names
// Note: booksActive and finesOwed are UI helpers (not in UserResponse; derived from /api/v1/transaction and /api/v1/fine)
const INITIAL_MEMBERS: Member[] = [
  {
    id: 'usr-0001', fullName: 'Reinhard Kenson', email: 'reinhard@university.edu',
    role: 'member', isActive: true, booksActive: 2, finesOwed: 0,
    badges: [ACTIVE_BADGE],
  },
  {
    id: 'usr-0002', fullName: 'Priya Sharma', email: 'priya.sharma@university.edu',
    role: 'member', isActive: true, booksActive: 4, finesOwed: 0,
    badges: [ACTIVE_BADGE],
  },
  {
    id: 'usr-0003', fullName: 'Arjun Mehta', email: 'arjun.m@university.edu',
    role: 'member', isActive: true, booksActive: 1, finesOwed: 20,
    badges: [ACTIVE_BADGE],
  },
  {
    id: 'usr-0004', fullName: 'Lena Fischer', email: 'lena.f@university.edu',
    role: 'member', isActive: true, booksActive: 3, finesOwed: 0,
    badges: [ACTIVE_BADGE],
  },
  {
    id: 'usr-0005', fullName: 'Raj Patel', email: 'raj.patel@university.edu',
    role: 'member', isActive: false, booksActive: 0, finesOwed: 350,
    badges: [BLACKLISTED_BADGE],
  },
  {
    id: 'usr-0006', fullName: 'Sneha Iyer', email: 'sneha.iyer@university.edu',
    role: 'member', isActive: false, booksActive: 0, finesOwed: 120,
    badges: [BLACKLISTED_BADGE],
  },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className={styles.skeletonWrapper}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeletonCell} style={{ width: 36 }}>
            <Skeleton variant="rectangular" width={36} height={36} style={{ borderRadius: 8 }} />
          </div>
          <div className={styles.skeletonCell} style={{ flex: 2 }}>
            <Skeleton variant="text" width="70%" height={14} />
            <Skeleton variant="text" width="50%" height={12} style={{ marginTop: 4 }} />
          </div>
          <div className={styles.skeletonCell} style={{ flex: 1 }}>
            <Skeleton variant="text" width="80%" height={14} />
          </div>
          <div className={styles.skeletonCell} style={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={14} />
          </div>
          <div className={styles.skeletonCell} style={{ flex: 1 }}>
            <Skeleton variant="rectangular" width={60} height={22} style={{ borderRadius: 50 }} />
          </div>
          <div className={styles.skeletonCell} style={{ flex: 1 }}>
            <Skeleton variant="rectangular" width={72} height={22} style={{ borderRadius: 50 }} />
          </div>
          <div className={styles.skeletonCell}>
            <Skeleton variant="rectangular" width={80} height={30} style={{ borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Edit modal (name + email only — privacy) ──────────────────────────────────
// Matches UserUpdateRequest: only fullName is editable by admin via PUT /api/v1/user/{id}
// (password requires member's own request; email is not in UserUpdateRequest)
interface MemberFormData {
  fullName: string;
}

const EMPTY_FORM: MemberFormData = { fullName: '' };

interface EditMemberModalProps {
  initial?: MemberFormData;
  onSave: (data: MemberFormData) => void;
  onClose: () => void;
}

function EditMemberModal({ initial = EMPTY_FORM, onSave, onClose }: EditMemberModalProps) {
  const [form, setForm] = useState<MemberFormData>(initial);

  const set = (field: keyof MemberFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Member</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={styles.fieldLabel}>Full Name *
            <input className={styles.fieldInput} value={form.fullName} onChange={set('fullName')} placeholder="e.g. John Doe" required />
          </label>
          {/* Note: email is not in UserUpdateRequest — not editable via PUT /api/v1/user/{id} */}
          <p className={styles.privacyNote}>Only the member's display name can be updated here. Status (isActive) is toggled via the status pill.</p>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
interface DeleteModalProps {
  memberName: string;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteModal({ memberName, onConfirm, onClose }: DeleteModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Delete Member</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className={styles.deleteMsg}>
          Are you sure you want to remove <strong>{memberName}</strong> from the system? This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button className={styles.btnDanger} onClick={onConfirm}>Delete Member</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function MemberDirectoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [activeFilter, setActiveFilter] = useState<MemberStatus>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: replace with GET /api/v1/user
  // params: search, userId, email, fullName, role, isActive, page, size
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const handleEdit = (data: MemberFormData) => {
    if (!editTarget) return;
    // TODO: PUT /api/v1/user/{id} — body: UserUpdateRequest { fullName }
    setMembers(prev => prev.map(m => m.id === editTarget.id ? { ...m, fullName: data.fullName } : m));
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    // TODO: DELETE /api/v1/user/{id}
    setMembers(prev => prev.filter(m => m.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // TODO: PUT /api/v1/user/{id} — body: UserUpdateRequest { isActive: boolean }
  const handleToggleStatus = (member: Member) => {
    const nextActive = !member.isActive;
    const nextBadges = member.badges.filter(b => b.label !== 'Active Member' && b.label !== 'Blacklisted');
    nextBadges.unshift(nextActive ? ACTIVE_BADGE : BLACKLISTED_BADGE);
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, isActive: nextActive, badges: nextBadges } : m));
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return members
      .filter(m => (m.isActive ? 'Active' : 'Blacklisted') === activeFilter)
      .filter(m =>
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
      );
  }, [members, activeFilter, searchQuery]);

  const activeCount = members.filter(m => m.isActive).length;
  const blacklistedCount = members.filter(m => !m.isActive).length;

  return (
    <AppShell
      userName="System Admin"
      activeNavItem="Members"
      role="admin"
      searchConfig={{
        placeholder: 'Search members by name, email or ID…',
        query: searchQuery,
        onQueryChange: setSearchQuery,
      }}
    >
      <div className={styles.pageContainer}>
        {/* Header row */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Member Directory</h1>
            <p className={styles.pageSubtitle}>{members.length} registered members · New members self-register</p>
          </div>
        </div>

        {/* Toggle pill */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${activeFilter === 'Active' ? styles.toggleBtnActive : ''}`}
            onClick={() => setActiveFilter('Active')}
          >
            Active
            <span className={styles.toggleCount}>{activeCount}</span>
          </button>
          <button
            className={`${styles.toggleBtn} ${activeFilter === 'Blacklisted' ? styles.toggleBtnActiveBlacklisted : ''}`}
            onClick={() => setActiveFilter('Blacklisted')}
          >
            Blacklisted
            <span className={styles.toggleCount}>{blacklistedCount}</span>
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p>{searchQuery ? 'No members match your search.' : `No ${activeFilter.toLowerCase()} members.`}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Member</th>
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Badges</th>
                  <th className={styles.th}>Books / Fines</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(member => (
                  <tr key={member.id} className={styles.tr}>
                    {/* Member name + email */}
                    <td className={styles.td}>
                      <div className={styles.memberCell}>
                        <div className={styles.avatar}>{member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div>
                          <div className={styles.memberName}>{member.fullName}</div>
                          <div className={styles.memberEmail}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Member ID */}
                    <td className={styles.td}>
                      <span className={styles.memberIdChip}>{member.id}</span>
                    </td>
                    {/* Role */}
                    <td className={styles.td}>
                      <span className={styles.dept}>{member.role}</span>
                    </td>
                    {/* Status toggle */}
                    <td className={styles.td}>
                      <button
                        className={`${styles.statusPill} ${member.isActive ? styles.statusActive : styles.statusBlacklisted}`}
                        onClick={() => handleToggleStatus(member)}
                        title={`Click to mark as ${member.isActive ? 'Blacklisted' : 'Active'}`}
                      >
                        <span className={styles.statusDot} />
                        {member.isActive ? 'Active' : 'Blacklisted'}
                      </button>
                    </td>
                    {/* Badges */}
                    <td className={styles.td}>
                      <div className={styles.badgeRow}>
                        {member.badges.map(b => (
                          <span
                            key={b.label}
                            className={styles.badge}
                            style={{ color: b.color, background: b.bg, borderColor: b.border }}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Books / Fines */}
                    <td className={styles.td}>
                      <div className={styles.booksFinecell}>
                        <span className={styles.booksLabel}>{member.booksActive} active</span>
                        {member.finesOwed > 0 && (
                          <span className={styles.fineLabel}>₹{member.finesOwed} owed</span>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className={styles.td}>
                      <div className={styles.actionRow}>
                        <button
                          className={styles.actionBtn}
                          title="Edit name / email"
                          onClick={() => setEditTarget(member)}
                        >
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          title="Delete member"
                          onClick={() => setDeleteTarget(member)}
                        >
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {editTarget && (
        <EditMemberModal
          initial={{ fullName: editTarget.fullName }}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal memberName={deleteTarget.fullName} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
    </AppShell>
  );
}
