import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';
import type { SearchConfig } from '../AppShell/AppShell';

export interface TopbarProps {
  userName?: string;
  role?: 'admin' | 'member';
  /** Provided by the current page via AppShell. Controls search behaviour. */
  searchConfig?: SearchConfig;
}

export const Topbar: React.FC<TopbarProps> = ({
  userName = 'User',
  role = 'member',
  searchConfig,
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

      {/* Left side: Controlled Search Bar — only shown when the page provides searchConfig */}
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

          <svg className={styles.searchIconInline} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      ) : (
        <div className={styles.searchGroupPlaceholder} />
      )}

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