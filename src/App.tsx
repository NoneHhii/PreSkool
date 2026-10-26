import React from 'react';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './page/auth/login.tsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './page/dashboard/Dashboard.tsx';
import Profile from './page/profile/Profile.tsx';

// Helper to verify user authentication status safely
const isAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return Boolean(token && user && JSON.parse(user));
  } catch {
    return false;
  }
};

// Route Guard for protected pages (Dashboard, Profile)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Route Guard for public-only pages (Login)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
