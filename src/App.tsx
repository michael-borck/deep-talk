import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { TranscriptDetailPage } from './pages/TranscriptDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { SearchPage } from './pages/SearchPage';
import { TrashPage } from './pages/TrashPage';
import { ArchivePage } from './pages/ArchivePage';
import { ChatHistoryPage } from './pages/ChatHistoryPage';
import { UploadPage } from './pages/UploadPage';
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
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/project/:id" element={<ProjectDetailPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/transcript/:id" element={<TranscriptDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/chat-history" element={<ChatHistoryPage />} />
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