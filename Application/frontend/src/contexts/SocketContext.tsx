import { createContext, useContext } from 'react';

interface SocketContextValue {
  setSubscribedCameras: (ids: string[]) => void;
}

export const SocketContext = createContext<SocketContextValue>({
  setSubscribedCameras: () => {},
});

export function useSocketContext() {
  return useContext(SocketContext);
}
