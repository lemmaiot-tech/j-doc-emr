
import React from 'react';
import { Stethoscope } from './icons/Icons';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      {/* In a real app, you would replace this with: <img src="/src/images/j-doc.png" alt="J DOC Logo" /> */}
      <div className="p-2 bg-white rounded-full">
         <Stethoscope className="w-6 h-6 text-primary-700" />
      </div>
      <span className="text-xl font-bold text-white tracking-wider">J DOC</span>
    </div>
  );
};

export default Logo;
