import {createContext, useContext} from "react";

interface NotificationContextType {
    lastEvent: string | null;
    isConnected: boolean;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
