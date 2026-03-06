import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/atoms/Icon';
import styles from './Topbar.module.css';
import type { SearchConfig } from '../AppShell/AppShell';

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      .toUpperCase().replace(/ /g, '-');

  const hasCategory = searchConfig?.showCategoryDropdown && (searchConfig.categories?.length ?? 0) > 0;

  return (
    <header className={styles.topbar}>

      {/* Left group: hamburger (mobile only) + search bar */}
      <div className={styles.leftGroup}>
        {onMenuClick && (
          <button
            className={styles.hamburgerBtn}
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Icon name="hamburger" size={20} />
          </button>
        )}

        {/* Search Bar — only shown when the page provides searchConfig */}
        {searchConfig ? (
          <div className={styles.searchGroup}>
            {/* Category dropdown — only rendered when the current page requests it */}
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
          </div>
        ) : (
          <div className={styles.searchGroupPlaceholder} />
        )}
      </div>

      {/* Right side: System Info & Profile */}
      <div className={styles.systemInfo}>
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