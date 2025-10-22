
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <h2 className="mt-4 text-3xl font-bold text-gray-800 dark:text-white">Page Not Found</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link to="/" className="mt-6">
        <Button>
            Go back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
