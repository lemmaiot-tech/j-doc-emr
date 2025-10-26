import React from 'react';
import Card from './Card';
import { Hourglass } from '../icons/Icons';

const ComingSoon: React.FC = () => {
  return (
    <Card>
      <div className="text-center py-16">
        <Hourglass className="mx-auto h-12 w-12 text-primary-400" />
        <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Coming Soon</h3>
        <p className="mt-2 text-md text-gray-500 dark:text-gray-400">
          This feature is currently under development. Please check back later!
        </p>
      </div>
    </Card>
  );
};

export default ComingSoon;
