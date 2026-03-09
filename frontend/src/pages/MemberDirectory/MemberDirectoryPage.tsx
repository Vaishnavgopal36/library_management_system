import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService, type UserResponse } from '../../services/user.service';
import styles from './MemberDirectoryPage.module.css';
import { Icon } from '../../components/atoms/Icon';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';
import { notificationService } from '../../services/notification.service';

// ── Derived status ─────────────────────────────────────────────────────────────
type MemberFilter = 'Active' | 'Blacklisted';

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
            <Skeleton variant="rectangular" width={80} height={28} style={{ borderRadius: 50 }} />
          </div>
          <div className={styles.skeletonCell}>
            <Skeleton variant="rectangular" width={80} height={30} style={{ borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
interface EditSaveData {
  fullName?: string;
  email?: string;
  password?: string;
}

interface EditModalProps {
  member: UserResponse;
  onSave: (data: EditSaveData) => Promise<void>;
  onClose: () => void;
}

function EditMemberModal({ member, onSave, onClose }: EditModalProps) {
  const [fullName, setFullName] = useState(member.fullName ?? '');
  const [email, setEmail] = useState(member.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Username / Email is required.'); return; }
    if (password && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setIsSaving(true); setError('');
    const data: EditSaveData = {};
    if (fullName.trim()) data.fullName = fullName.trim();
    if (email.trim() !== member.email) data.email = email.trim();
    if (password) data.password = password;
    try {
      await onSave(data);
    } catch (err: any) {
      setError(err?.message ?? 'Update failed.');
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Member</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <Icon name="x-close" size={18} strokeWidth={2.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <p style={{ color: 'var(--color-danger-600)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          <label className={styles.fieldLabel}>
            Full Name
            <input
              className={styles.fieldInput}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              autoFocus
            />
          </label>
          <label className={styles.fieldLabel}>
            Username / Email *
            <input
              className={styles.fieldInput}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              required
            />
          </label>
          <label className={styles.fieldLabel}>
            New Password
            <input
              className={styles.fieldInput}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              autoComplete="new-password"
            />
          </label>
          {password && (
            <label className={styles.fieldLabel}>
              Confirm New Password
              <input
                className={styles.fieldInput}
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </label>
          )}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Notify modal ─────────────────────────────────────────────────────────────
interface NotifyModalProps {
  member: UserResponse;
  onClose: () => void;
}

function NotifyModal({ member, onClose }: NotifyModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true); setError('');
    try {
      await notificationService.adminSend(member.id, message.trim());
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send notification.');
      setIsSending(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Notify Member</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <Icon name="x-close" size={18} strokeWidth={2.5} />
          </button>
        </div>
        <form onSubmit={handleSend} className={styles.modalForm}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Send a notification to <strong>{member.fullName || member.email}</strong>.
          </p>
          {error && <p style={{ color: 'var(--color-danger-600)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: 'var(--color-success-700, #15803d)', fontSize: '0.875rem', margin: 0 }}>Notification sent!</p>}
          <label className={styles.fieldLabel}>
            Message *
            <textarea
              className={styles.fieldInput}
              style={{ minHeight: 90, resize: 'vertical' }}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter notification message…"
              required
              autoFocus
              disabled={success}
            />
          </label>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSending}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={isSending || success}>
              {isSending ? 'Sending…' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
interface DeleteModalProps {
  memberName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function DeleteModal({ memberName, onConfirm, onClose }: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try { await onConfirm(); }
    catch { setIsDeleting(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Deactivate Member</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <Icon name="x-close" size={18} strokeWidth={2.5} />
          </button>
        </div>
        <p className={styles.deleteMsg}>
          Deactivate <strong>{memberName}</strong>? They will lose access to the library system.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button className={styles.btnDanger} onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deactivating...' : 'Deactivate Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function MemberDirectoryPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<MemberFilter>('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [editTarget, setEditTarget] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<UserResponse | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadMembers = useCallback(() => {
    setIsLoading(true);
    userService.list({ role: 'member', size: 100 })
      .then(p => setMembers(p.content))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleEdit = async (data: { fullName?: string; email?: string; password?: string }) => {
    await userService.update(editTarget!.id, data);
    setMembers(prev => prev.map(m =>
      m.id === editTarget!.id
        ? { ...m, ...(data.fullName !== undefined && { fullName: data.fullName }), ...(data.email !== undefined && { email: data.email }) }
        : m
    ));
    setEditTarget(null);
  };

  const handleDelete = async () => {
    await userService.deactivate(deleteTarget!.id);
    setMembers(prev => prev.filter(m => m.id !== deleteTarget!.id));
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (member: UserResponse) => {
    setTogglingId(member.id);
    try {
      const updated = await userService.update(member.id, { isActive: !member.isActive });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, isActive: updated.isActive } : m));
    } catch (err: any) {
      alert(err?.message ?? 'Failed to update member status.');
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = members.filter(m => m.isActive).length;
  const blacklistedCount = members.filter(m => !m.isActive).length;

  const filtered = useMemo(() => {
    const isActive = activeFilter === 'Active';
    const q = searchQuery.toLowerCase();
    return members
      .filter(m => m.isActive === isActive)
      .filter(m =>
        !q ||
        (m.fullName ?? '').toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q),
      );
  }, [members, activeFilter, searchQuery]);

  return (
    <AppShell
      userName={user?.fullName ?? 'Admin'}
      activeNavItem="Members"
      role="admin"
      searchConfig={{
        placeholder: 'Search members by name or email…',
        query: searchQuery,
        onQueryChange: setSearchQuery,
      }}
    >
      <div className={styles.pageContainer}>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Member Directory</h1>
            <p className={styles.pageSubtitle}>{members.length} registered members</p>
          </div>
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${activeFilter === 'Active' ? styles.toggleBtnActive : ''}`}
            onClick={() => setActiveFilter('Active')}
          >
            Active<span className={styles.toggleCount}>{activeCount}</span>
          </button>
          <button
            className={`${styles.toggleBtn} ${activeFilter === 'Blacklisted' ? styles.toggleBtnActiveBlacklisted : ''}`}
            onClick={() => setActiveFilter('Blacklisted')}
          >
            Blacklisted<span className={styles.toggleCount}>{blacklistedCount}</span>
          </button>
        </div>

        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name="users" size={48} stroke="var(--color-surface-300)" strokeWidth={1.5} />
            <p>{searchQuery ? 'No members match your search.' : `No ${activeFilter.toLowerCase()} members.`}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Member</th>
                  <th className={`${styles.th} ${styles.colHideXs}`}>Role</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(member => (
                  <tr key={member.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.memberCell}>
                        <div className={styles.avatar}>
                          {(member.fullName || member.email || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.memberName}>{member.fullName || <em style={{ color: 'var(--color-text-tertiary, #9ca3af)' }}>No name set</em>}</div>
                          <div className={styles.memberEmail}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.colHideXs}`}>
                      <span className={styles.dept}>{member.role}</span>
                    </td>
                    <td className={styles.td}>
                      <button
                        className={`${styles.statusPill} ${member.isActive ? styles.statusActive : styles.statusBlacklisted}`}
                        onClick={() => handleToggleStatus(member)}
                        disabled={togglingId === member.id}
                        title={`Click to mark as ${member.isActive ? 'Blacklisted' : 'Active'}`}
                      >
                        <span className={styles.statusDot} />
                        {togglingId === member.id ? '…' : member.isActive ? 'Active' : 'Blacklisted'}
                      </button>
                    </td>
                    <td className={styles.td}>
                      {member.isActive ? (
                        <div className={styles.actionRow}>
                          <button
                            className={styles.actionBtn}
                            title="Send notification"
                            onClick={() => setNotifyTarget(member)}
                          >
                            <Icon name="bell" size={15} />
                          </button>
                          <button
                            className={styles.actionBtn}
                            title="Edit name"
                            onClick={() => setEditTarget(member)}
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            title="Deactivate member"
                            onClick={() => setDeleteTarget(member)}
                          >
                            <Icon name="trash-2" size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className={styles.btnPrimary}
                          disabled={togglingId === member.id}
                          onClick={() => handleToggleStatus(member)}
                        >
                          {togglingId === member.id ? 'Activating…' : 'Activate User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notifyTarget && (
        <NotifyModal
          member={notifyTarget}
          onClose={() => setNotifyTarget(null)}
        />
      )}
      {editTarget && (
        <EditMemberModal
          member={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          memberName={deleteTarget.fullName || deleteTarget.email}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
