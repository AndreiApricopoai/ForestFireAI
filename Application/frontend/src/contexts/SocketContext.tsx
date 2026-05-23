import { createContext, useContext } from 'react';

/**
 * SocketContext makes the setSubscribedCameras callback available to any
 * page inside the Layout without prop-drilling.
 *
 * The socket itself lives in Layout (so it stays alive when navigating between pages).
 * DashboardPage consumes setSubscribedCameras to manage which camera rooms it joins.
 */
interface SocketContextValue {
  setSubscribedCameras: (ids: string[]) => void;
}

export const SocketContext = createContext<SocketContextValue>({
  setSubscribedCameras: () => {},
});

export function useSocketContext() {
  return useContext(SocketContext);
}
