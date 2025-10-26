import React from 'react';
import { useSync } from '../../contexts/SyncProvider';
import { Cloud, CloudOff, RefreshCw, CloudUpload } from '../icons/Icons';

const SyncStatus: React.FC = () => {
  const { status, lastSync, isOnline, triggerSync, pendingChangesCount } = useSync();

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff className="w-5 h-5" />,
        text: 'Offline',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
        tooltip: 'You are currently offline. Changes are saved locally.',
      };
    }
    
    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw className="w-5 h-5 animate-spin" />,
          text: 'Syncing...',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/50',
          tooltip: 'Synchronizing local data with the cloud.',
        };
      case 'synced':
         return {
          icon: <Cloud className="w-5 h-5" />,
          text: 'Synced',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/50',
          tooltip: `Last synced: ${lastSync?.toLocaleTimeString() || 'N/A'}`,
        };
      case 'error':
        return {
          icon: <CloudOff className="w-5 h-5" />,
          text: 'Sync Error',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/50',
          tooltip: 'Could not sync. Check connection and try again.',
        };
      case 'idle':
      default:
        if (pendingChangesCount > 0) {
           return {
            icon: <CloudUpload className="w-5 h-5" />,
            text: 'Pending',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/50',
            tooltip: `${pendingChangesCount} changes waiting to be synced.`,
           }
        }
        return {
          icon: <Cloud className="w-5 h-5" />,
          text: 'Synced',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/50',
          tooltip: 'All local changes are synced with the cloud.',
        };
    }
  };

  const { icon, text, color, bgColor, tooltip } = getStatusInfo();

  return (
    <div className="relative group flex items-center">
        <button
            onClick={triggerSync}
            disabled={status === 'syncing' || !isOnline}
            className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors duration-200 ${color} ${bgColor} disabled:opacity-70 disabled:cursor-wait`}
        >
            {icon}
            <span className="text-sm font-medium hidden sm:inline">{text}</span>
            {pendingChangesCount > 0 && status !== 'syncing' && (
              <span className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-primary-600' : 'bg-yellow-500 !text-gray-800'}`}>
                {pendingChangesCount}
              </span>
            )}
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
            {tooltip}
        </div>
    </div>

  );
};

export default SyncStatus;