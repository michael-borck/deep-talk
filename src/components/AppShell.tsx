import React from 'react';
import { Navigation } from './Navigation';
import { StatusBar } from './StatusBar';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: any) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentPage, onPageChange }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Title bar area for macOS */}
      {navigator.platform.includes('Mac') && (
        <div className="h-7 bg-white border-b border-gray-200 titlebar-drag" />
      )}
      
      {/* Navigation */}
      <Navigation activePage={currentPage} onPageChange={onPageChange} />
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      {/* Status bar */}
      <StatusBar />
    </div>
  );
};