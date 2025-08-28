// src/contexts/SocketContext.jsx
import { createContext,  useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Establish Socket.IO connection only if user is authenticated
      const newSocket = io("http://localhost:5000", {
        auth: {
          token: token,
        },
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or if user/logout changes
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // If no user, ensure socket is closed
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user, token]); // Reconnect if user or token changes

  // Function to join user's personal room
  const joinUserRoom = () => {
    if (socket && user) {
      socket.emit("join-user-room", user.id);
    }
  };

  const value = {
    socket,
    isConnected,
    joinUserRoom,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
