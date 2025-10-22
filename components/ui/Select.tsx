
import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, error, children, ...props }, ref) => {
    const baseClasses = "block w-full pl-3 pr-10 py-2 text-base border rounded-md shadow-sm focus:outline-none sm:text-sm transition-colors duration-200";
    const normalClasses = "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-primary-500 focus:border-primary-500";
    const errorClasses = "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500";
  
    return (
      <div>
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <select
          ref={ref}
          className={`${baseClasses} ${error ? errorClasses : normalClasses}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
});
  
Select.displayName = 'Select';

export default Select;
