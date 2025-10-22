import React from 'react';
import { useSync } from '../../contexts/SyncContext';
import { Cloud, CloudOff, RefreshCw } from '../icons/Icons';

const SyncStatus: React.FC = () => {
  const { status, lastSync, triggerSync } = useSync();

  const getStatusInfo = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw className="w-5 h-5 animate-spin" />,
          text: 'Syncing...',
          color: 'text-blue-500',
          tooltip: 'Synchronizing local data with the cloud.',
        };
      case 'synced':
        return {
          icon: <Cloud className="w-5 h-5" />,
          text: 'Synced',
          color: 'text-green-500',
          tooltip: `Last synced: ${lastSync?.toLocaleTimeString() || 'N/A'}`,
        };
      case 'error':
        return {
          icon: <CloudOff className="w-5 h-5" />,
          text: 'Sync Error',
          color: 'text-red-500',
          tooltip: 'Could not sync. Check connection and try again.',
        };
      case 'idle':
      default:
        return {
          icon: <Cloud className="w-5 h-5" />,
          text: 'Ready',
          color: 'text-gray-500',
          tooltip: 'Ready to sync.',
        };
    }
  };

  const { icon, text, color, tooltip } = getStatusInfo();

  return (
    <div className="relative group flex items-center">
        <button
            onClick={triggerSync}
            disabled={status === 'syncing'}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors duration-200 ${color} bg-gray-100 dark:bg-gray-700 disabled:opacity-70 disabled:cursor-wait`}
        >
            {icon}
            <span className="text-sm font-medium hidden sm:inline">{text}</span>
        </button>
        <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {tooltip}
        </div>
    </div>

  );
};

export default SyncStatus;
