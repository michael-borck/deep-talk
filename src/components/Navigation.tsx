import React from 'react';

interface NavigationProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activePage, onPageChange }) => {
  const tabs = [
    { id: 'home', label: '🏠 Home', name: 'Home' },
    { id: 'projects', label: '📁 Projects', name: 'Projects' },
    { id: 'library', label: '📋 Library', name: 'Library' },
    { id: 'settings', label: '⚙️ Settings', name: 'Settings' },
    { id: 'about', label: 'ℹ️ About', name: 'About' }
  ];

  return (
    <nav className="bg-white border-b border-surface-200 px-6">
      <div className="flex items-center h-12 space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onPageChange(tab.id)}
            className={`
              px-4 py-2 text-sm font-medium transition-colors relative
              ${activePage === tab.id 
                ? 'text-primary-800' 
                : 'text-surface-600 hover:text-surface-900'
              }
            `}
          >
            <span>{tab.label}</span>
            {activePage === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-800 tab-indicator" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};