import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { App } from 'antd';
import { API_BASE_URL } from '@/shared/config/api/apiConfig';
import { useAuth } from '@/shared/lib';
import {useQueryClient} from "@tanstack/react-query";

interface NotificationContextType {
    lastEvent: string | null;
    isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { notification } = App.useApp();
    const [lastEvent, setLastEvent] = useState<string | null>('init');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }

        const eventSource = new EventSource(`${API_BASE_URL}/subscribe`);

        eventSource.onopen = () => {
            console.log('SSE connection opened');
            setIsConnected(true);
        };

        eventSource.addEventListener('notification', (event) => {
            notification.success({
                message: 'Processing Complete',
                description: event.data,
                placement: 'bottomRight',
                duration: null
            });

            setLastEvent(event.data);
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['book'] });
        });

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            setIsConnected(false);
        };

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, [user, notification]);

    return (
        <NotificationContext.Provider value={{ lastEvent, isConnected }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
