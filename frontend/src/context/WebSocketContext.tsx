import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

type Notification = {
  id: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: Date;
};

type WebSocketContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  lastRefreshEvent: { type: string; timestamp: number } | null;
};

const WebSocketContext = createContext<WebSocketContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  lastRefreshEvent: null,
});

function getWsUrl(userId: string): string {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  // Convert http(s) to ws(s)
  const wsBase = apiUrl.replace(/^http/, 'ws');
  return `${wsBase}/api/v1/ws/${userId}`;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastRefreshEvent, setLastRefreshEvent] = useState<{ type: string; timestamp: number } | null>(null);
  const ws = useRef<WebSocket | null>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      return;
    }

    const connectWs = () => {
      const wsUrl = getWsUrl(user.id);
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type?.startsWith("refresh_")) {
            setLastRefreshEvent({ type: data.type, timestamp: Date.now() });
          }
          
          if (data.message) {
            const newNotif: Notification = {
              id: Math.random().toString(36).substring(7),
              message: data.message,
              type: data.type,
              read: false,
              timestamp: new Date()
            };
            setNotifications(prev => [newNotif, ...prev]);
            
            // Show toast for non-refresh events or specific refresh events
            if (data.type === 'notification' || data.type?.startsWith("refresh_")) {
              toast.info(data.message);
            }
          }
        } catch (e) {
          console.error("Error parsing websocket message", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        setTimeout(connectWs, 3000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error", error);
        socket.close();
      };

      ws.current = socket;
    };

    connectWs();

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <WebSocketContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, lastRefreshEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
