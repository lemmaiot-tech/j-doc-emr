import React from 'react';
import { useUndo } from '../../contexts/UndoContext';
import Button from './Button';

const UndoToast: React.FC = () => {
  const { toast, handleUndo, dismissToast } = useUndo();

  const handleUndoClick = () => {
    handleUndo();
  };

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 z-[100]"
    >
      <div
        className={`w-full max-w-sm bg-gray-800 text-white rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-500 ease-in-out ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {toast && (
            <div className="p-4">
            <div className="flex items-center">
                <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
                </div>
                <div className="flex-shrink-0 ml-4 flex space-x-2">
                <Button variant="ghost" size="sm" onClick={handleUndoClick} className="!text-primary-400 hover:!bg-gray-700">
                    Undo
                </Button>
                <button
                    onClick={dismissToast}
                    className="inline-flex text-gray-400 hover:text-gray-200 focus:outline-none"
                >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                </div>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UndoToast;