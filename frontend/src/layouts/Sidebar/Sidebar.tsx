import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../../components/atoms/Icon';
import styles from './Sidebar.module.css';

/**
 * Module-level variable so the collapsed state survives component remounts
 * (each page creates its own AppShell → Sidebar, resetting local state).
 */
let persistedCollapsed = false;

export interface SidebarProps {
  activeItem?: string;
  role?: 'admin' | 'member';
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onNavigate?: (item: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem = 'Dashboard',
  role = 'member',
  isMobileOpen = false,
  onCloseMobile,
  onNavigate 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(persistedCollapsed);
  const navigate = useNavigate();

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    persistedCollapsed = next;
    setIsCollapsed(next);
  };

  // 2. Dynamically inject the role into the paths!
  const navItems: { name: string; path: string; icon: IconName }[] = [
    { name: 'Dashboard', path: `/${role}/dashboard`, icon: 'home' },
    { name: 'Search', path: `/${role}/search`, icon: 'search' },
    { name: role === 'admin' ? 'Transaction Ledger' : 'My History', path: `/${role}/history`, icon: 'clock' },
    { name: 'Fines & Payments', path: `/${role}/fines`, icon: 'credit-card' },
    { name: 'Reservations', path: `/${role}/reservations`, icon: 'calendar' },
    ...(role === 'admin' ? [{ name: 'Members', path: '/admin/members', icon: 'users' as IconName }] : []),
    { name: 'Support/Help', path: `/${role}/support`, icon: 'help-circle' },
  ];

  const footerNavItems = [
    { name: 'About', path: `/${role}/about` },
    { name: 'Terms & Condition', path: `/${role}/terms` },
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
      
      <div className={styles.header}>
        <button
          className={styles.hamburger}
          onClick={isMobileOpen ? onCloseMobile : toggleCollapsed}
          aria-label={isMobileOpen ? 'Close navigation menu' : isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <Icon name="hamburger" size={24} />
        </button>
        <h1 className={styles.logoText}>BookStop</h1>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.name} className={styles.navItem}>
              <button
                className={`${styles.navButton} ${activeItem === item.name ? styles.active : ''}`}
                onClick={() => {
                  if (onNavigate) onNavigate(item.name);
                  if (item.path !== '#') navigate(item.path);
                  onCloseMobile?.();
                }}
              >
                <div className={styles.iconWrapper}><Icon name={item.icon} size={20} /></div>
                <span className={styles.navText}>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        {!isCollapsed && (
          <ul className={styles.footerList}>
            {footerNavItems.map((item) => (
              <li key={item.name} className={styles.footerItem}>
                <button className={styles.footerButton} onClick={() => navigate(item.path)}>{item.name}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};