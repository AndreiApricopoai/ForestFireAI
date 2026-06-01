import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AlertRecord } from '../../types/alert.types';

interface AlertsState {

  alerts: AlertRecord[];

  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: AlertsState = {
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    fetchAlertsStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchAlertsSuccess(state, action: PayloadAction<AlertRecord[]>) {
      state.isLoading = false;
      state.alerts = action.payload;
    },
    fetchAlertsFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    addAlert(state, action: PayloadAction<AlertRecord>) {
      state.alerts.unshift(action.payload);
      state.unreadCount += 1;
    },

    markAllRead(state) {
      state.unreadCount = 0;
    },

    updateAlertStatus(
      state,
      action: PayloadAction<{ id: string; status: AlertRecord['status']; note?: string }>,
    ) {
      const alert = state.alerts.find((a) => a.id === action.payload.id);
      if (alert) {
        alert.status = action.payload.status;
        if (action.payload.note !== undefined) alert.note = action.payload.note;
      }
    },
  },
});

export const {
  fetchAlertsStart,
  fetchAlertsSuccess,
  fetchAlertsFailure,
  addAlert,
  markAllRead,
  updateAlertStatus,
} = alertsSlice.actions;

export default alertsSlice.reducer;
