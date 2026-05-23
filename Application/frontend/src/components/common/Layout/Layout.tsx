import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import { useSocket } from '../../../hooks/useSocket';
import { SocketContext } from '../../../contexts/SocketContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cameras': 'Camera Management',
  '/alerts': 'Alerts',
  '/admin/cameras': 'Manage Cameras',
  '/settings': 'Settings',
};

export default function Layout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'ForestFire AI';

  /**
   * The socket lives here in Layout so it stays connected while the user
   * navigates between Dashboard, Alerts, and admin pages.
   *
   * - 'detection:new' events are always dispatched to Redux regardless of page
   * - 'alert:new' events are dispatched to Redux when the user is an admin
   * - setSubscribedCameras is passed down via SocketContext so DashboardPage
   *   can tell the server which camera rooms to join/leave
   */
  const { setSubscribedCameras } = useSocket();

  return (
    <SocketContext.Provider value={{ setSubscribedCameras }}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Navbar title={title} />
          <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </SocketContext.Provider>
  );
}
