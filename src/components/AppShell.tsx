import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { StatusBar } from './StatusBar';
import { GlobalUploadModal } from './GlobalUploadModal';
import { AboutDialog } from './AboutDialog';
import { LicensesModal } from './LicensesModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showLicensesModal, setShowLicensesModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Listen for menu actions
  useEffect(() => {
    const handleMenuAction = (action: string) => {
      if (action === 'show-about') {
        setShowAboutDialog(true);
      } else if (action === 'show-licenses') {
        setShowLicensesModal(true);
      } else if (action === 'new-upload') {
        setShowUploadModal(true);
      }
    };

    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction(handleMenuAction);
    }

    // Cleanup
    return () => {
      if (window.electronAPI?.removeAllListeners) {
        window.electronAPI.removeAllListeners('menu-action');
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={setIsSidebarCollapsed}
        onUploadClick={() => setShowUploadModal(true)}
        onAboutClick={() => setShowAboutDialog(true)}
      />
      
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

      {/* Global Upload Modal */}
      <GlobalUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {/* About Dialog */}
      <AboutDialog 
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
        onShowLicenses={() => {
          setShowAboutDialog(false);
          setShowLicensesModal(true);
        }}
      />

      {/* Licenses Modal */}
      <LicensesModal 
        isOpen={showLicensesModal}
        onClose={() => setShowLicensesModal(false)}
      />
    </div>
  );
};