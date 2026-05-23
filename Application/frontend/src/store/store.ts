import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import camerasReducer from './slices/camerasSlice';
import alertsReducer from './slices/alertsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cameras: camerasReducer,
    alerts: alertsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
