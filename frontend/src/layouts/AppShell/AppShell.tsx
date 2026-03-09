import React, { useState } from 'react';
import styles from './AppShell.module.css';
import { Sidebar } from '../Sidebar/Sidebar';
import { Topbar } from '../Topbar/Topbar';

/** Search configuration passed from a page to the Topbar via AppShell. */
export interface SearchConfig {
  /** Controlled query value. */
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  /** Show a category dropdown (Search page only — legacy, use searchTypes instead). */
  showCategoryDropdown?: boolean;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (cat: string) => void;
  /** Search-by type selector ('title' | 'author' | 'category'). */
  searchTypes?: string[];
  searchType?: string;
  onSearchTypeChange?: (type: string) => void;
}

export interface AppShellProps {
  userName?: string;
  activeNavItem?: string;
  role?: 'admin' | 'member';
  /** Optional search config provided by the current page. */
  searchConfig?: SearchConfig;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  userName = 'Kenson',
  activeNavItem = 'Dashboard',
  role = 'member',
  searchConfig,
  children,
}) => {
  const [currentNav, setCurrentNav] = useState(activeNavItem);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className={styles.themeWrapper}>
      <div className={styles.appShell}>
        <Sidebar
          activeItem={currentNav}
          role={role}
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onNavigate={setCurrentNav}
        />
        <div className={styles.mainContainer}>
          <Topbar
            userName={userName}
            role={role}
            searchConfig={searchConfig}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
          <main className={styles.contentArea}>
            {children}
          </main>
        </div>
      </div>
      {mobileSidebarOpen && (
        <div className={styles.backdrop} onClick={() => setMobileSidebarOpen(false)} />
      )}
    </div>
  );
};