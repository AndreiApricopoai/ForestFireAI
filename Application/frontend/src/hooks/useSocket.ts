import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { updateLatestDetection } from '../store/slices/camerasSlice';
import { addAlert } from '../store/slices/alertsSlice';
import type { LatestDetection } from '../types/camera.types';
import type { AlertRecord } from '../types/alert.types';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * useSocket — manages the Socket.IO connection to the NestJS backend.
 *
 * Lifecycle:
 *   - Connects when the hook mounts (user opens the app inside Layout)
 *   - Listens for 'detection:new' events and dispatches them to Redux
 *   - If the logged-in user is an admin, also joins the "admins" room and
 *     listens for 'alert:new' events, dispatching them to the alerts slice
 *   - Disconnects when the component using the hook unmounts
 *
 * Room subscription:
 *   - Call setSubscribedCameras(ids) whenever the set of visible cameras changes
 *   - The hook diffs the new list against the current set and only sends
 *     subscribe/unsubscribe for the delta to minimise WebSocket traffic
 */
export function useSocket() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  // Stable ref to the Socket.IO instance — does not cause re-renders
  const socketRef = useRef<Socket | null>(null);

  // Set of camera IDs we are currently subscribed to
  const subscribedIds = useRef<Set<string>>(new Set());

  // Track whether we've already joined the admins room (avoid duplicate joins)
  const adminRoomJoined = useRef(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;
    adminRoomJoined.current = false;

    socket.on('connect', () => {
      console.log('[Socket] Connected to NestJS — id:', socket.id);

      // Join the "admins" Socket.IO room so this client receives alert:new events
      if (isAdmin && !adminRoomJoined.current) {
        socket.emit('subscribeAlerts');
        adminRoomJoined.current = true;
        console.log('[Socket] Subscribed to admins room for real-time alerts');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected —', reason);
      adminRoomJoined.current = false;
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    /**
     * 'detection:new' — emitted every time the Python worker sends a detection
     * for a camera the user is subscribed to.
     * Dispatched to Redux so CameraCard components re-render with new data.
     */
    socket.on(
      'detection:new',
      (payload: Omit<LatestDetection, 'cameraId'> & { cameraId: string }) => {
        dispatch(updateLatestDetection(payload as LatestDetection));
      },
    );

    /**
     * 'alert:new' — emitted ONLY to clients in the "admins" room.
     * Dispatched to the alerts Redux slice which:
     *   - Prepends the alert to the alerts list
     *   - Increments the unread badge count shown in the Navbar
     */
    if (isAdmin) {
      socket.on('alert:new', (payload: AlertRecord) => {
        console.log('[Socket] alert:new received — camera:', payload.cameraId, 'type:', payload.type);
        dispatch(addAlert(payload));
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
      subscribedIds.current.clear();
      adminRoomJoined.current = false;
    };
    // isAdmin is derived from user?.role — changes only on login/logout which re-mounts anyway
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isAdmin]);

  /**
   * Tell the server which cameras this user is currently watching.
   *
   * Call this whenever the list of visible cameras changes (on mount, on filter change).
   * Diffs against the current subscriptions and only sends changes.
   */
  const setSubscribedCameras = useCallback((newIds: string[]) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    const current = subscribedIds.current;
    const incoming = new Set(newIds);

    const toUnsubscribe = [...current].filter((id) => !incoming.has(id));
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
