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
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideocamIcon from '@mui/icons-material/Videocam';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/useAppDispatch';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Cameras', icon: <VideocamIcon />, path: '/cameras' },
  { label: 'Alerts', icon: <NotificationsIcon />, path: '/alerts' },
];

const adminItems = [
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

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
          borderRight: '1px solid rgba(46, 125, 50, 0.2)',
        },
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LocalFireDepartmentIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
        <Box>
          <Typography variant="subtitle1" color="primary.light" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            ForestFire
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI Monitor
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(46,125,50,0.2)' }} />

      <Box sx={{ px: 1.5, py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                    bgcolor: 'rgba(46, 125, 50, 0.2)',
                    '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.28)' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.light' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontSize: 14, color: active ? 'primary.light' : 'text.primary' } } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {user?.role === 'admin' && (
        <>
          <Divider sx={{ borderColor: 'rgba(46,125,50,0.2)', my: 1 }} />
          <Box sx={{ px: 1.5, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
              Admin
            </Typography>
          </Box>
          <List dense sx={{ px: 1 }}>
            {adminItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': { bgcolor: 'rgba(46, 125, 50, 0.2)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.light' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontSize: 14 } } }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </>
      )}

      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(46,125,50,0.2)' }}>
        <Tooltip title={user?.email ?? ''}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user?.name}
            </Typography>
            <Chip
              label={user?.role === 'admin' ? 'Admin' : 'User'}
              size="small"
              color={user?.role === 'admin' ? 'secondary' : 'primary'}
              sx={{ mt: 0.5, height: 20, fontSize: 11 }}
            />
          </Box>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
