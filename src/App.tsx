import './App.css'
import { ThemeProvider } from './contexts/ThemeContext'
import LoginPage from './page/auth/login.tsx'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './page/dashboard/Dashboard.tsx'
import Profile from './page/profile/Profile.tsx'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
