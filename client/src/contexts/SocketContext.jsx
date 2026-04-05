import { createContext, useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) {
      setSocket((prev) => { prev?.close(); return null; });
      setIsConnected(false);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setIsReconnecting(false);
      // Auto-join the personal room immediately after (re)connect
      newSocket.emit("join-user-room");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setIsConnected(false);
    });

    newSocket.on("reconnect_attempt", () => {
      setIsReconnecting(true);
    });

    newSocket.on("reconnect", () => {
      setIsReconnecting(false);
    });

    newSocket.on("reconnect_failed", () => {
      setIsReconnecting(false);
      console.error("Socket failed to reconnect after max attempts");
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
      setIsReconnecting(false);
    };
  }, [user, token]);

  // Exposed for components that need to manually re-join (e.g. after navigate)
  const joinUserRoom = useCallback(() => {
    if (socket?.connected) {
      socket.emit("join-user-room");
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isReconnecting, joinUserRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
