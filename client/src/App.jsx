import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OmbrivonDashboard from './pages/OmbrivonDashboard';  
import Signup from './pages/Signup';

function App() {
  const [token, setToken] = useState(localStorage.getItem('cloud_token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('cloud_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('cloud_token');
    setToken(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/signup"
          element={token ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />}
        />
        
        <Route
          path="/login"
          element={token ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        
        <Route
          path="/"
          element={token
            ? <Dashboard token={token} onLogout={handleLogout} />
            : <Navigate to="/login" />
          }
        />
        <Route
          path="/firewall"
          element={token ? <OmbrivonDashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;