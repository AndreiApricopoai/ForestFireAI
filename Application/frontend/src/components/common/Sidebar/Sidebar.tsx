import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/useAppDispatch';

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
  const { user } = useAppSelector((s) => s.auth);
  const unreadCount = useAppSelector((s) => s.alerts.unreadCount);

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
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LocalFireDepartmentIcon sx={{ color: '#e53935', fontSize: 22 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1, color: 'text.primary' }}>
            ForestFire
          </Typography>
          <Typography variant="caption" color="text.secondary">
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

      {/* User info at bottom */}
      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Tooltip title={user?.email ?? ''}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user?.name}
            </Typography>
            <Chip
              label={user?.role === 'admin' ? 'Admin' : 'User'}
              size="small"
              sx={{
                mt: 0.5,
                height: 20,
                fontSize: 11,
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'text.secondary',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </Box>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
