import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

/**
 * Module-level variable so the collapsed state survives component remounts
 * (each page creates its own AppShell → Sidebar, resetting local state).
 */
let persistedCollapsed = false;

export interface SidebarProps {
  activeItem?: string;
  role?: 'admin' | 'member'; // 1. Add the role prop
  onNavigate?: (item: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem = 'Dashboard',
  role = 'member', // Default to member for safety
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
  const navItems = [
    { name: 'Dashboard', path: `/${role}/dashboard`, icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path> },
    { name: 'Search', path: `/${role}/search`, icon: <><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></> },
    { name: role === 'admin' ? 'Transaction Ledger' : 'My History', path: `/${role}/history`, icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path> },
    { name: 'Fines & Payments', path: `/${role}/fines`, icon: <><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></> },
    { name: 'Reservations', path: `/${role}/reservations`, icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></> },
    ...(role === 'admin' ? [{ name: 'Members', path: '/admin/members', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></> }] : []),
    { name: 'Support/Help', path: `/${role}/support`, icon: <><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></> }
  ];

  const footerNavItems = [
    { name: 'About', path: `/${role}/about` },
    { name: 'Terms & Condition', path: `/${role}/terms` },
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      
      <div className={styles.header}>
        <button className={styles.hamburger} onClick={toggleCollapsed}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
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
                }}
              >
                <div className={styles.iconWrapper}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg></div>
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