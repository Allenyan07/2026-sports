
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import History from './pages/History';
import CategorySettings from './pages/CategorySettings';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/categories" element={<CategorySettings />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
};

export default App;
