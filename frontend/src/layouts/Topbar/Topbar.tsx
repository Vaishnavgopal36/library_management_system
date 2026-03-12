import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/atoms/Icon';
import styles from './Topbar.module.css';
import type { SearchConfig } from '../AppShell/AppShell';
import { notificationService } from '../../services/notification.service';
import { USER_KEY } from '../../services/api';

export interface TopbarProps {
  userName?: string;
  role?: 'admin' | 'member';
  /** Provided by the current page via AppShell. Controls search behaviour. */
  searchConfig?: SearchConfig;
  /** Called when the mobile hamburger is tapped (opens sidebar drawer). */
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  userName = 'User',
  role = 'member',
  searchConfig,
  onMenuClick,
}) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(USER_KEY)) return;
    const fetchCount = () =>
      notificationService.unreadCount()
        .then(setUnreadCount)
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      .toUpperCase().replace(/ /g, '-');

  const hasSearchTypes = (searchConfig?.searchTypes?.length ?? 0) > 0;
  const hasCategory = !hasSearchTypes && searchConfig?.showCategoryDropdown && (searchConfig.categories?.length ?? 0) > 0;
  const showCategoryInline = hasSearchTypes
    && searchConfig?.searchType === 'category'
    && (searchConfig?.categories?.length ?? 0) > 0;

  return (
    <header className={styles.topbar}>

      {/* Hamburger — direct topbar child so it lands in Row 1 on mobile
          (order: 1 in the topbar flex context, not buried inside leftGroup) */}
      {onMenuClick && (
        <button
          className={styles.hamburgerBtn}
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Icon name="hamburger" size={20} />
        </button>
      )}

      {/* Left group: search bar only (hamburger moved out above) */}
      <div className={styles.leftGroup}>

        {/* Search Bar — only shown when the page provides searchConfig */}
        {searchConfig ? (
          <>
          {searchConfig?.onSmartSearchToggle && (
            <button
              type="button"
              onClick={() => searchConfig.onSmartSearchToggle!(!searchConfig.isSmartSearch)}
              className={`${styles.smartToggle} ${searchConfig.isSmartSearch ? styles.smartToggleActive : ''}`}
              title="Toggle AI Semantic Search"
            >
              {searchConfig.isSmartSearch ? 'Semantic Search ON' : 'Semantic Search OFF  '}
            </button>
          )}
          <div className={styles.searchGroup}>
            {/* Search-by type selector (Title / Author / Category) */}
            {hasSearchTypes && (
              <>
                <select
                  className={styles.searchSelect}
                  value={searchConfig.searchType ?? searchConfig.searchTypes![0]}
                  onChange={(e) => searchConfig.onSearchTypeChange?.(e.target.value)}
                >
                  {searchConfig.searchTypes!.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <div className={styles.divider} />
              </>
            )}

            {/* Legacy category dropdown */}
            {hasCategory && (
              <>
                <select
                  className={styles.searchSelect}
                  value={searchConfig.selectedCategory ?? 'All Categories'}
                  onChange={(e) => searchConfig.onCategoryChange?.(e.target.value)}
                >
                  {searchConfig.categories!.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className={styles.divider} />
              </>
            )}

            {/* When searchType is 'category', replace text input with category select */}
            {showCategoryInline ? (
              <select
                className={styles.searchSelect}
                style={{ flex: 1, paddingRight: '0.5rem' }}
                value={searchConfig.selectedCategory ?? searchConfig.categories![0]}
                onChange={(e) => searchConfig.onCategoryChange?.(e.target.value)}
              >
                {searchConfig.categories!.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <>
                <Icon name="search" size={16} className={styles.searchIconInline} />

                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={searchConfig.placeholder ?? 'Search…'}
                  value={searchConfig.query}
                  onChange={(e) => searchConfig.onQueryChange(e.target.value)}
                />

                {searchConfig.query && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    aria-label="Clear search"
                    onClick={() => searchConfig.onQueryChange('')}
                  >
                    <Icon name="x-close" size={14} />
                  </button>
                )}
              </>
            )}
          </div>
          </>
        ) : (
          <div className={styles.searchGroupPlaceholder} />
        )}
      </div>

      {/* Right side: System Info & Profile */}
      <div className={styles.systemInfo}>
        {/* Bell / Notifications */}
        <button
          className={styles.bellBtn}
          aria-label="Notifications"
          onClick={() => navigate(`/${role}/notifications`)}
        >
          <Icon name="bell" size={20} />
          {unreadCount > 0 && (
            <span className={styles.bellBadge}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className={styles.dateTime}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <span className={styles.date}>{formatDate(currentTime)}</span>
        </div>
        <div
          className={styles.profile}
          onClick={() => navigate(`/${role}/profile`)}
          role="button"
          tabIndex={0}
          aria-label="View profile"
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/${role}/profile`)}
        >
          <div className={styles.avatar}></div>
          <span className={styles.userName}>{userName}</span>
        </div>
      </div>

    </header>
  );
};