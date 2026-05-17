import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAppDispatch } from './useAppDispatch';
import { updateLatestDetection } from '../store/slices/camerasSlice';
import type { LatestDetection } from '../types/camera.types';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * useSocket — manages the Socket.IO connection to the NestJS backend.
 *
 * Lifecycle:
 *   - Connects when the hook mounts (user opens the dashboard)
 *   - Listens for 'detection:new' events and dispatches them to Redux
 *   - Disconnects when the component using the hook unmounts
 *
 * Room subscription:
 *   - Call setSubscribedCameras(ids) whenever the set of visible cameras changes
 *   - The hook calculates the diff and only sends subscribe/unsubscribe for the delta
 *
 * NestJS room naming: "camera:<cameraId>"
 */
export function useSocket() {
  const dispatch = useAppDispatch();

  // Stable ref to the Socket.IO instance — does not cause re-renders
  const socketRef = useRef<Socket | null>(null);

  // Set of camera IDs we are currently subscribed to
  // Using a ref so setSubscribedCameras can read current state without stale closures
  const subscribedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Create the socket connection once on mount
    const socket = io(SOCKET_URL, {
      // Prefer WebSocket transport — avoids the HTTP polling handshake overhead
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to NestJS — id:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected —', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    /**
     * 'detection:new' is emitted by NestJS every time the Python worker
     * sends a detection for a camera the user is currently subscribed to.
     *
     * We dispatch it to Redux so every CameraCard re-renders automatically.
     */
    socket.on('detection:new', (payload: Omit<LatestDetection, 'cameraId'> & { cameraId: string }) => {
      dispatch(updateLatestDetection(payload as LatestDetection));
    });

    // Cleanup: disconnect when the component unmounts (user leaves the dashboard)
    return () => {
      socket.disconnect();
      socketRef.current = null;
      subscribedIds.current.clear();
    };
  }, [dispatch]);

  /**
   * Tell the server which cameras this user is currently watching.
   *
   * Call this whenever the list of visible cameras changes (on mount, on filter change).
   * The function diffs the new list against the previously subscribed set and only sends
   * the changes — minimises WebSocket traffic.
   *
   * Example:
   *   User sees cameras A, B, C → setSubscribedCameras(['A','B','C'])
   *   User filters to only C   → setSubscribedCameras(['C'])
   *   → backend receives: unsubscribe(['A','B']), subscribe([]) (C was already subscribed)
   */
  const setSubscribedCameras = useCallback((newIds: string[]) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    const current = subscribedIds.current;
    const incoming = new Set(newIds);

    // Cameras that were visible but are no longer
    const toUnsubscribe = [...current].filter((id) => !incoming.has(id));

    // Cameras that are newly visible
    const toSubscribe = newIds.filter((id) => !current.has(id));

    if (toUnsubscribe.length > 0) {
      socket.emit('unsubscribe', toUnsubscribe);
      toUnsubscribe.forEach((id) => current.delete(id));
      console.log('[Socket] Unsubscribed from rooms:', toUnsubscribe);
    }

    if (toSubscribe.length > 0) {
      socket.emit('subscribe', toSubscribe);
      toSubscribe.forEach((id) => current.add(id));
      console.log('[Socket] Subscribed to rooms:', toSubscribe);
    }
  }, []);

  return { setSubscribedCameras };
}
