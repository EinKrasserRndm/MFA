import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DataFormPage from './pages/DataFormPage';
import DataManagementPage from './pages/DataManagementPage';
import StatsPage from './pages/StatsPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/form" element={<DataFormPage />} />
          <Route path="/manage" element={<DataManagementPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;