import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { RegisterPage } from '../pages/Register/RegisterPage';
import { MemberDashboard } from '../pages/Member/MemberDashboard';
import { AdminDashboard } from '../pages/Admin/AdminDashboard';
import { SearchPage } from '../pages/AdminSearch/AdminSearchPage';
import { HistoryPage } from '../pages/History/HistoryPage';
import { FinesPage } from '../pages/Fines/FinesPage';
import { ReservationsPage } from '../pages/Reservations/ReservationsPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';
import { MemberDirectoryPage } from '../pages/MemberDirectory/MemberDirectoryPage';
import { AboutPage } from '../pages/About/AboutPage';
import { TermsPage } from '../pages/Terms/TermsPage';
import { SupportPage } from '../pages/Support/SupportPage';

// This acts as a centralized map of your entire application's URLs
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
  // We will eventually wrap these in a <ProtectedRoute> component!
  {
    path: '/member/dashboard',
    element: <MemberDashboard />,
  },
  {
    path: '/member/search',
    element: <SearchPage role="member" />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/search',
    element: <SearchPage role="admin" />,
  },
  {
    path: '/member/history',
    element: <HistoryPage role="member" />,
  },
  {
    path: '/admin/history',
    element: <HistoryPage role="admin" />,
  },
  {
    path: '/member/fines',
    element: <FinesPage role="member" />,
  },
  {
    path: '/admin/fines',
    element: <FinesPage role="admin" />,
  },
  {
    path: '/member/reservations',
    element: <ReservationsPage role="member" />,
  },
  {
    path: '/admin/reservations',
    element: <ReservationsPage role="admin" />,
  },
  {
    path: '/member/profile',
    element: <ProfilePage role="member" />,
  },
  {
    path: '/admin/profile',
    element: <ProfilePage role="admin" />,
  },
  {
    path: '/admin/members',
    element: <MemberDirectoryPage />,
  },
  {
    path: '/member/about',
    element: <AboutPage role="member" />,
  },
  {
    path: '/admin/about',
    element: <AboutPage role="admin" />,
  },
  {
    path: '/member/terms',
    element: <TermsPage role="member" />,
  },
  {
    path: '/admin/terms',
    element: <TermsPage role="admin" />,
  },
  {
    path: '/member/support',
    element: <SupportPage role="member" />,
  },
  {
    path: '/admin/support',
    element: <SupportPage role="admin" />,
  },
]);