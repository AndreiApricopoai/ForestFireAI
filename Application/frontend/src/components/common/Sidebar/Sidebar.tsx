import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { logout } from '../../../store/slices/authSlice';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
];

const adminItems = [
  { label: 'Alerts', icon: <NotificationsActiveIcon />, path: '/alerts', badge: true },
  { label: 'Manage Cameras', icon: <VideocamOffIcon />, path: '/admin/cameras', badge: false },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const unreadCount = useAppSelector((s) => s.alerts.unreadCount);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, height: 64 }}>
        <LocalFireDepartmentIcon sx={{ color: '#ff0000', fontSize: 22, flexShrink: 0 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
            ForestFire
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            AI Monitor
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ px: 1.5, py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
          Navigation
        </Typography>
      </Box>

      <List dense sx={{ px: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={active}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.07)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'text.primary' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: { fontSize: 14, color: active ? 'text.primary' : 'text.secondary' },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {user?.role === 'admin' && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 1.5, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
              Admin
            </Typography>
          </Box>
          <List dense sx={{ px: 1 }}>
            {adminItems.map((item) => {
              const active = location.pathname === item.path;
              const badgeCount = item.badge ? unreadCount : 0;
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.07)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: active ? 'text.primary' : 'text.secondary' }}>
                      <Badge badgeContent={badgeCount > 0 ? badgeCount : undefined} color="error" max={99}>
                        {item.icon}
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          sx: { fontSize: 14, color: active ? 'text.primary' : 'text.secondary' },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </>
      )}

      {/* User info + logout at bottom */}
      <Box sx={{ mt: 'auto', px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {user?.email}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: user?.role === 'admin' ? 'rgba(229,57,53,0.85)' : 'text.secondary',
                fontWeight: 500,
                letterSpacing: 0.3,
              }}
            >
              {user?.role === 'admin' ? 'Administrator' : 'User'}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.light' } }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Drawer>
  );
}
