import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ServiceProvider } from './contexts/ServiceContext';
import { TranscriptProvider } from './contexts/TranscriptContext';
import { ProjectProvider } from './contexts/ProjectContext';

const App: React.FC = () => {
  return (
    <ServiceProvider>
      <TranscriptProvider>
        <ProjectProvider>
          <Router>
            <AppShell>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/project/:id" element={<ProjectDetailPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </AppShell>
          </Router>
        </ProjectProvider>
      </TranscriptProvider>
    </ServiceProvider>
  );
};

export default App;