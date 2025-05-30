import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { ServiceProvider } from './contexts/ServiceContext';
import { TranscriptProvider } from './contexts/TranscriptContext';

type PageType = 'home' | 'library' | 'settings' | 'about';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  useEffect(() => {
    // Listen for navigation events from menu
    window.electronAPI.onNavigate((page) => {
      setCurrentPage(page as PageType);
    });

    return () => {
      window.electronAPI.removeAllListeners('navigate');
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'library':
        return <LibraryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <ServiceProvider>
      <TranscriptProvider>
        <AppShell currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderPage()}
        </AppShell>
      </TranscriptProvider>
    </ServiceProvider>
  );
};

export default App;