import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

type Notification = {
  id: string;
  message: string;
  type: string;
  read: boolean;
  time: string;
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

    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;
    const lastMsgMap = new Map<string, number>(); // dedup: message -> timestamp

    const connectWs = () => {
      // Close existing connection before reconnecting
      if (ws.current) {
        ws.current.onclose = null; // prevent reconnect loop
        ws.current.close();
        ws.current = null;
      }

      const wsUrl = getWsUrl(user.id);
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Dedup: skip if same message received within 2s
          const msgKey = `${data.type}:${data.message}`;
          const now = Date.now();
          if (lastMsgMap.has(msgKey) && now - lastMsgMap.get(msgKey)! < 2000) {
            return; // skip duplicate
          }
          lastMsgMap.set(msgKey, now);
          // Clean old entries
          for (const [key, ts] of lastMsgMap) {
            if (now - ts > 5000) lastMsgMap.delete(key);
          }

          // Trigger data refresh for refresh events
          if (data.type?.startsWith("refresh_")) {
            setLastRefreshEvent({ type: data.type, timestamp: now });
          }
          
          // Only create notification + toast for messages
          if (data.message) {
            const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const newNotif: Notification = {
              id: Math.random().toString(36).substring(7),
              message: data.message,
              type: data.type,
              read: false,
              time: timeStr,
              timestamp: new Date()
            };
            setNotifications(prev => [newNotif, ...prev.slice(0, 49)]); // keep max 50
            toast.info(data.message);
          }
        } catch (e) {
          console.error("Error parsing websocket message", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        if (isMounted) {
          reconnectTimeout = setTimeout(connectWs, 3000);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error", error);
        socket.close();
      };

      ws.current = socket;
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.onclose = null; // prevent reconnect on cleanup
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
