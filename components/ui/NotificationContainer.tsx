import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../types';
import { Pill, Scissors, CheckCircle } from '../icons/Icons';

const iconMap = {
    info: <Pill className="h-6 w-6 text-blue-500" />,
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    // Add more if needed
};

interface NotificationToastProps {
    notification: Notification;
    onDismiss: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
    // A simple heuristic to choose icon based on title
    const getIcon = () => {
        if (notification.title.toLowerCase().includes('surgery')) {
            return <Scissors className="h-6 w-6 text-blue-500" />;
        }
        return iconMap[notification.type] || iconMap.info;
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {getIcon()}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {notification.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={onDismiss}
                            className="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <span className="sr-only">Close</span>
                             <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotifications();

    if (!notifications.length) {
        return null;
    }

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-start justify-end px-4 py-6 pointer-events-none sm:p-6 z-[100]"
        >
            <div className="w-full max-w-sm space-y-3">
                {notifications.map(n => (
                    <NotificationToast key={n.id} notification={n} onDismiss={() => removeNotification(n.id)} />
                ))}
            </div>
        </div>
    );
};

export default NotificationContainer;
