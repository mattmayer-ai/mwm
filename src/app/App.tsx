import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ProjectsPage } from './routes/projects';
import { ProjectDetail } from './routes/projects/ProjectDetail';
import { ChatHome } from './routes/home/ChatHome';
import About from './routes/about';
import Contact from './routes/contact';
import NotFound from './routes/404';
import { trackPageView } from '../lib/analytics';
import { ThemeProvider } from './providers/ThemeProvider';

// Navigation removed - logo and actions are in ChatHome and QuickActionsDock

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<ChatHome />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <AppRoutes />
          {/* AdminPanel is now controlled from ControlsMenu, not rendered here */}
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

