import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { RegisterPage } from '../pages/Register/RegisterPage';
import { MemberDashboard } from '../pages/Member/MemberDashboard';
import { AdminDashboard } from '../pages/Admin/AdminDashboard';
import { SearchPage } from '../pages/Search/AdminSearchPage';
import { HistoryPage } from '../pages/History/HistoryPage';
import { FinesPage } from '../pages/Fines/FinesPage';
import { ReservationsPage } from '../pages/Reservations/ReservationsPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';
import { MemberDirectoryPage } from '../pages/MemberDirectory/MemberDirectoryPage';
import { AboutPage } from '../pages/About/AboutPage';
import { TermsPage } from '../pages/Terms/TermsPage';
import { SupportPage } from '../pages/Support/SupportPage';
import { NotificationsPage } from '../pages/Notifications/NotificationsPage';
import { ProtectedRoute } from '../components/atoms/ProtectedRoute/ProtectedRoute';

// Helper to reduce boilerplate
const member = (el: React.ReactElement) => (
  <ProtectedRoute role="member">{el}</ProtectedRoute>
);
const admin = (el: React.ReactElement) => (
  <ProtectedRoute role="admin">{el}</ProtectedRoute>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  // ── Member routes ────────────────────────────────────────────────────────────
  { path: '/member/dashboard',    element: member(<MemberDashboard />) },
  { path: '/member/search',       element: member(<SearchPage role="member" />) },
  { path: '/member/history',      element: member(<HistoryPage role="member" />) },
  { path: '/member/fines',        element: member(<FinesPage role="member" />) },
  { path: '/member/reservations', element: member(<ReservationsPage role="member" />) },
  { path: '/member/profile',      element: member(<ProfilePage role="member" />) },
  { path: '/member/about',        element: member(<AboutPage role="member" />) },
  { path: '/member/terms',        element: member(<TermsPage role="member" />) },
  { path: '/member/support',      element: member(<SupportPage role="member" />) },
  { path: '/member/notifications', element: member(<NotificationsPage role="member" />) },
  // ── Admin routes ─────────────────────────────────────────────────────────────
  { path: '/admin/dashboard',    element: admin(<AdminDashboard />) },
  { path: '/admin/search',       element: admin(<SearchPage role="admin" />) },
  { path: '/admin/history',      element: admin(<HistoryPage role="admin" />) },
  { path: '/admin/fines',        element: admin(<FinesPage role="admin" />) },
  { path: '/admin/reservations', element: admin(<ReservationsPage role="admin" />) },
  { path: '/admin/profile',      element: admin(<ProfilePage role="admin" />) },
  { path: '/admin/members',      element: admin(<MemberDirectoryPage />) },
  { path: '/admin/about',        element: admin(<AboutPage role="admin" />) },
  { path: '/admin/terms',        element: admin(<TermsPage role="admin" />) },
  { path: '/admin/support',      element: admin(<SupportPage role="admin" />) },
  { path: '/admin/notifications', element: admin(<NotificationsPage role="admin" />) },
]);