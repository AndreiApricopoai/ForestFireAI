import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute/ProtectedRoute';
import Layout from '../components/common/Layout/Layout';
import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AdminCamerasPage from '../pages/Admin/AdminCamerasPage';
import AlertsPage from '../pages/Alerts/AlertsPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {

    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
    ],
  },
  {

    element: <ProtectedRoute requiredRole="admin" />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/admin/cameras',
            element: <AdminCamerasPage />,
          },
          {
            path: '/alerts',
            element: <AlertsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
