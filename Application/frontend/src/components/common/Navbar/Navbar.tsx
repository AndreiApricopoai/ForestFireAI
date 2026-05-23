import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { logout } from '../../../store/slices/authSlice';
import { markAllRead } from '../../../store/slices/alertsSlice';

interface Props {
  title?: string;
}

export default function Navbar({ title = 'Dashboard' }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const unreadCount = useAppSelector((s) => s.alerts.unreadCount);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAlertsClick = () => {
    dispatch(markAllRead());
    navigate('/alerts');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid rgba(46, 125, 50, 0.2)',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {title}
        </Typography>

        {/* Bell icon — shows unread alert badge for admins only */}
        {isAdmin && (
          <IconButton
            color="inherit"
            size="small"
            onClick={handleAlertsClick}
            title="View alerts"
          >
            <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="error" max={99}>
              <NotificationsIcon
                sx={{ color: unreadCount > 0 ? 'error.light' : 'text.secondary' }}
              />
            </Badge>
          </IconButton>
        )}

        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark', fontSize: 14 }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ gap: 1, color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
