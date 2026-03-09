/**
 * Centralized SVG path data for every icon in the application.
 * All icons share viewBox="0 0 24 24", fill="none", stroke-based rendering.
 *
 * Each entry is an array of SVG child-element descriptors so we can emit
 * the correct element type (`path`, `circle`, `line`, `rect`, `polyline`,
 * `polygon`).
 */

export type SvgElement =
  | { tag: 'path'; d: string }
  | { tag: 'circle'; cx: number; cy: number; r: number }
  | { tag: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { tag: 'rect'; x: number; y: number; width: number; height: number; rx?: number; ry?: number }
  | { tag: 'polyline'; points: string }
  | { tag: 'polygon'; points: string };

export type IconName =
  | 'hamburger'
  | 'home'
  | 'search'
  | 'clock'
  | 'credit-card'
  | 'calendar'
  | 'users'
  | 'help-circle'
  | 'x-close'
  | 'book-open'
  | 'book-logo'
  | 'eye'
  | 'eye-off'
  | 'check'
  | 'settings'
  | 'star'
  | 'user'
  | 'mail'
  | 'phone'
  | 'briefcase'
  | 'lock'
  | 'edit'
  | 'trash'
  | 'trash-2'
  | 'alert-triangle'
  | 'slash'
  | 'check-square'
  | 'info'
  | 'bell'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'archive'
  | 'play';

export const ICON_PATHS: Record<IconName, SvgElement[]> = {
  hamburger: [
    { tag: 'line', x1: 3, y1: 12, x2: 21, y2: 12 },
    { tag: 'line', x1: 3, y1: 6, x2: 21, y2: 6 },
    { tag: 'line', x1: 3, y1: 18, x2: 21, y2: 18 },
  ],

  home: [
    { tag: 'path', d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  ],

  search: [
    { tag: 'circle', cx: 11, cy: 11, r: 8 },
    { tag: 'line', x1: 21, y1: 21, x2: 16.65, y2: 16.65 },
  ],

  clock: [
    { tag: 'path', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ],

  'credit-card': [
    { tag: 'rect', x: 2, y: 5, width: 20, height: 14, rx: 2 },
    { tag: 'line', x1: 2, y1: 10, x2: 22, y2: 10 },
  ],

  calendar: [
    { tag: 'rect', x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: 'line', x1: 16, y1: 2, x2: 16, y2: 6 },
    { tag: 'line', x1: 8, y1: 2, x2: 8, y2: 6 },
    { tag: 'line', x1: 3, y1: 10, x2: 21, y2: 10 },
  ],

  users: [
    { tag: 'path', d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
    { tag: 'circle', cx: 9, cy: 7, r: 4 },
    { tag: 'path', d: 'M23 21v-2a4 4 0 0 0-3-3.87' },
    { tag: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' },
  ],

  'help-circle': [
    { tag: 'circle', cx: 12, cy: 12, r: 10 },
    { tag: 'path', d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' },
    { tag: 'line', x1: 12, y1: 17, x2: 12.01, y2: 17 },
  ],

  'x-close': [
    { tag: 'path', d: 'M18 6L6 18' },
    { tag: 'path', d: 'M6 6l12 12' },
  ],

  'book-open': [
    { tag: 'path', d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' },
    { tag: 'path', d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
  ],

  'book-logo': [
    { tag: 'path', d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20' },
  ],

  eye: [
    { tag: 'path', d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' },
    { tag: 'circle', cx: 12, cy: 12, r: 3 },
  ],

  'eye-off': [
    { tag: 'path', d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' },
    { tag: 'line', x1: 1, y1: 1, x2: 23, y2: 23 },
  ],

  check: [
    { tag: 'polyline', points: '20 6 9 17 4 12' },
  ],

  settings: [
    { tag: 'circle', cx: 12, cy: 12, r: 3 },
    { tag: 'path', d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  ],

  star: [
    { tag: 'polygon', points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' },
  ],

  user: [
    { tag: 'path', d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' },
    { tag: 'circle', cx: 12, cy: 7, r: 4 },
  ],

  mail: [
    { tag: 'path', d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' },
    { tag: 'polyline', points: '22,6 12,13 2,6' },
  ],

  phone: [
    { tag: 'path', d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18z' },
  ],

  briefcase: [
    { tag: 'rect', x: 2, y: 7, width: 20, height: 14, rx: 2, ry: 2 },
    { tag: 'path', d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
  ],

  lock: [
    { tag: 'rect', x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 },
    { tag: 'path', d: 'M7 11V7a5 5 0 0 1 10 0v4' },
  ],

  edit: [
    { tag: 'path', d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' },
    { tag: 'path', d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' },
  ],

  trash: [
    { tag: 'polyline', points: '3 6 5 6 21 6' },
    { tag: 'path', d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
  ],

  'trash-2': [
    { tag: 'polyline', points: '3 6 5 6 21 6' },
    { tag: 'path', d: 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' },
    { tag: 'path', d: 'M10 11v6' },
    { tag: 'path', d: 'M14 11v6' },
    { tag: 'path', d: 'M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' },
  ],

  'alert-triangle': [
    { tag: 'path', d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
    { tag: 'line', x1: 12, y1: 9, x2: 12, y2: 13 },
    { tag: 'line', x1: 12, y1: 17, x2: 12.01, y2: 17 },
  ],

  slash: [
    { tag: 'circle', cx: 12, cy: 12, r: 10 },
    { tag: 'line', x1: 4.93, y1: 4.93, x2: 19.07, y2: 19.07 },
  ],

  'check-square': [
    { tag: 'polyline', points: '9 11 12 14 22 4' },
    { tag: 'path', d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  ],

  info: [
    { tag: 'circle', cx: 12, cy: 12, r: 10 },
    { tag: 'line', x1: 12, y1: 8, x2: 12, y2: 12 },
    { tag: 'line', x1: 12, y1: 16, x2: 12.01, y2: 16 },
  ],

  bell: [
    { tag: 'path', d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
    { tag: 'path', d: 'M13.73 21a2 2 0 0 1-3.46 0' },
  ],

  'chevron-down': [
    { tag: 'polyline', points: '6 9 12 15 18 9' },
  ],

  'chevron-left': [
    { tag: 'polyline', points: '15 18 9 12 15 6' },
  ],

  'chevron-right': [
    { tag: 'polyline', points: '9 18 15 12 9 6' },
  ],

  archive: [
    { tag: 'polyline', points: '21 8 21 21 3 21 3 8' },
    { tag: 'rect', x: 1, y: 3, width: 22, height: 5 },
    { tag: 'line', x1: 10, y1: 12, x2: 14, y2: 12 },
  ],

  play: [
    { tag: 'polygon', points: '5 3 19 12 5 21 5 3' },
  ],
};
