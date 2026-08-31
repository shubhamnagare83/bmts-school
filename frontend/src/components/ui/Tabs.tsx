import React, { useState } from 'react';

export interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultIndex = 0, className = '' }) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${activeIndex === idx 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            onClick={() => setActiveIndex(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {tabs[activeIndex]?.content}
      </div>
    </div>
  );
};
