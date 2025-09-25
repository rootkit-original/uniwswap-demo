import './i18n'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import App from './App'
import AdminDashboard from './pages/AdminDashboard'

function RootApp() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default RootApp
