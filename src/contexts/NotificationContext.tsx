import * as React from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  animeId?: string; // Optional link to an anime
  read: boolean;
  createdAt: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  sendNotification: (userId: string, title: string, message: string, type?: Notification['type'], animeId?: string) => Promise<void>;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const markAsRead = async (id: string) => {
    // In a real app, update Firestore
    console.log('Marking as read:', id);
  };

  const sendNotification = async (userId: string, title: string, message: string, type: Notification['type'] = 'info', animeId?: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        animeId: animeId || null,
        read: false,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, sendNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
