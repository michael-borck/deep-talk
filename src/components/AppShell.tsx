import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { StatusBar } from './StatusBar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Title bar area for macOS */}
        {navigator.platform.includes('Mac') && (
          <div className="h-7 bg-white border-b border-gray-200 titlebar-drag" />
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        
        {/* Status bar */}
        <StatusBar />
      </div>
    </div>
  );
};