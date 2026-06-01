import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Link,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';
import { authApi } from '../../api/auth/auth.api';

function validateName(value: string): string {
  if (!value.trim()) return 'Name is required.';
  if (value.trim().length < 2) return 'Name must be at least 2 characters.';
  return '';
}

function validateEmail(value: string): string {
  if (!value.trim()) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Please enter a valid email address.';
  return '';
}

function validatePassword(value: string): string {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return '';
}

function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameTouched) setNameError(validateName(value));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailTouched) setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordTouched) setPasswordError(validatePassword(value));

    if (confirmTouched) setConfirmPasswordError(validateConfirmPassword(value, confirmPassword));
  };

  const handleConfirmChange = (value: string) => {
    setConfirmPassword(value);
    if (confirmTouched) setConfirmPasswordError(validateConfirmPassword(password, value));
  };

  const handleNameBlur = () => { setNameTouched(true); setNameError(validateName(name)); };
  const handleEmailBlur = () => { setEmailTouched(true); setEmailError(validateEmail(email)); };
  const handlePasswordBlur = () => { setPasswordTouched(true); setPasswordError(validatePassword(password)); };
  const handleConfirmBlur = () => { setConfirmTouched(true); setConfirmPasswordError(validateConfirmPassword(password, confirmPassword)); };

  const isFormValid = (): boolean => {
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirmPassword(password, confirmPassword);

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cErr);
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);

    return !nErr && !eErr && !pErr && !cErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    dispatch(loginStart());
    try {
      const res = await authApi.register({ name, email, password });
      dispatch(loginSuccess(res.data));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Registration failed. Please try again.';
      dispatch(loginFailure(message));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 420, p: 4 }}>
        {}
        <Box sx={{ textAlign: 'center', mb: 3, pb: 3, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <LocalFireDepartmentIcon sx={{ color: '#ff0000', fontSize: 22 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
              ForestFire AI
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register to access the monitoring platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            error={!!nameError}
            helperText={nameError}
            required
            fullWidth
            autoComplete="name"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            error={!!emailError}
            helperText={emailError}
            required
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={handlePasswordBlur}
            error={!!passwordError}
            helperText={passwordError || 'Minimum 8 characters'}
            required
            fullWidth
            autoComplete="new-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
              htmlInput: { minLength: 8 },
            }}
          />
          <TextField
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => handleConfirmChange(e.target.value)}
            onBlur={handleConfirmBlur}
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
            required
            fullWidth
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 1 }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="body2" align="center" color="text.secondary">
          Already have an account?{' '}
          <Link component="button" variant="body2" color="primary.light" onClick={() => navigate('/login')}>
            Sign in
          </Link>
        </Typography>

        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          <Link component="button" variant="body2" color="text.secondary" onClick={() => navigate('/')}>
            ← Back to home
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
