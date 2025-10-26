
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <img src="/images/j-doc.png" alt="J DOC Logo" className="h-10 w-10 object-contain" />
      <span className="text-xl font-bold text-white tracking-wider">J DOC</span>
    </div>
  );
};

export default Logo;
