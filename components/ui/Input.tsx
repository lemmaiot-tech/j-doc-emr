import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  endIcon?: React.ReactElement;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, endIcon, ...props }, ref) => {
  const baseClasses = "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm transition-colors duration-200";
  const normalClasses = "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500";
  const errorClasses = "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500";
  const withIconClasses = endIcon ? "pr-10" : "";

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          className={`${baseClasses} ${error ? errorClasses : normalClasses} ${withIconClasses}`}
          {...props}
        />
        {endIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;