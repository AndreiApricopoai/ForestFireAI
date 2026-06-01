import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { updateLatestDetection } from '../store/slices/camerasSlice';
import { addAlert } from '../store/slices/alertsSlice';
import type { LatestDetection } from '../types/camera.types';
import type { AlertRecord } from '../types/alert.types';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useSocket() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const socketRef = useRef<Socket | null>(null);

  const subscribedIds = useRef<Set<string>>(new Set());

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

      if (subscribedIds.current.size > 0) {
        const ids = [...subscribedIds.current];
        socket.emit('subscribe', ids);
        console.log('[Socket] Re-subscribed to camera rooms after connect:', ids);
      }

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

    socket.on(
      'detection:new',
      (payload: Omit<LatestDetection, 'cameraId'> & { cameraId: string }) => {
        dispatch(updateLatestDetection(payload as LatestDetection));
      },
    );

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

  }, [dispatch, isAdmin]);

  const setSubscribedCameras = useCallback((newIds: string[]) => {
    const socket = socketRef.current;
    const current = subscribedIds.current;
    const incoming = new Set(newIds);

    const toUnsubscribe = [...current].filter((id) => !incoming.has(id));
    const toSubscribe = newIds.filter((id) => !current.has(id));

    toUnsubscribe.forEach((id) => current.delete(id));
    toSubscribe.forEach((id) => current.add(id));

    if (socket && socket.connected) {
      if (toUnsubscribe.length > 0) {
        socket.emit('unsubscribe', toUnsubscribe);
        console.log('[Socket] Unsubscribed from rooms:', toUnsubscribe);
      }
      if (toSubscribe.length > 0) {
        socket.emit('subscribe', toSubscribe);
        console.log('[Socket] Subscribed to rooms:', toSubscribe);
      }
    }
  }, []);

  return { setSubscribedCameras };
}
