import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import { FileText, Users } from '../../components/icons/Icons';
import EmptyState from '../../components/ui/EmptyState';

const AuditLog: React.FC = () => {
  // Fetch logs and sort them by timestamp descending
  const auditLogs = useLiveQuery(() => 
    localDB.audit_logs.orderBy('timestamp').reverse().toArray(),
    []
  );

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Audit Log</h1>
      </div>
      <div className="overflow-x-auto">
        {auditLogs === undefined ? (
          <div className="text-center py-10">
            <div className="flex justify-center items-center text-gray-500">
              <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
              Loading audit logs...
            </div>
          </div>
        ) : auditLogs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No Audit Logs Found"
            message="User actions such as creating, updating, or deleting records will be logged here."
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sync Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.timestamp.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{log.userDisplayName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{log.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.syncStatus === 'synced' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Synced</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export default AuditLog;
