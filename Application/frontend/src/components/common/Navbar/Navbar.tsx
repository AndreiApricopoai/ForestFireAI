import { AppBar, Toolbar, Typography } from '@mui/material';

interface Props {
  title?: string;
}

export default function Navbar({ title = 'Dashboard' }: Props) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
