import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AlertRecord } from '../../types/alert.types';

interface AlertsState {
  /** All alerts loaded from the server, newest first */
  alerts: AlertRecord[];
  /** Number of alerts received since the page was last visited */
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
    /** Called when a real-time alert:new WebSocket event arrives */
    addAlert(state, action: PayloadAction<AlertRecord>) {
      state.alerts.unshift(action.payload); // prepend — newest first
      state.unreadCount += 1;
    },
    /** Called when the admin visits /alerts — resets the badge */
    markAllRead(state) {
      state.unreadCount = 0;
    },
    /** Update status of an alert after acknowledge/resolve action */
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
