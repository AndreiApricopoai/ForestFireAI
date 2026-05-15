import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Camera, CamerasState, LatestDetection } from '../../types/camera.types';

const initialState: CamerasState = {
  cameras: [],
  latestDetections: {},
  isLoading: false,
  error: null,
};

const camerasSlice = createSlice({
  name: 'cameras',
  initialState,
  reducers: {
    fetchCamerasStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchCamerasSuccess(state, action: PayloadAction<Camera[]>) {
      state.isLoading = false;
      state.cameras = action.payload;
    },
    fetchCamerasFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    addCamera(state, action: PayloadAction<Camera>) {
      state.cameras.push(action.payload);
    },
    updateCamera(state, action: PayloadAction<Camera>) {
      const index = state.cameras.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) state.cameras[index] = action.payload;
    },
    removeCamera(state, action: PayloadAction<string>) {
      state.cameras = state.cameras.filter((c) => c.id !== action.payload);
    },
    updateLatestDetection(state, action: PayloadAction<LatestDetection>) {
      state.latestDetections[action.payload.cameraId] = action.payload;
    },
  },
});

export const {
  fetchCamerasStart,
  fetchCamerasSuccess,
  fetchCamerasFailure,
  addCamera,
  updateCamera,
  removeCamera,
  updateLatestDetection,
} = camerasSlice.actions;

export default camerasSlice.reducer;
