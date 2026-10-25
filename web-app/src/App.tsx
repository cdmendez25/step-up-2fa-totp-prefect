import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SecurityPage } from './pages/SecurityPage'
import { VaultPage } from './pages/VaultPage'
import { VerifyPage } from './pages/VerifyPage'

// Flujo Step-Up: /login → (/security si el 2FA no está activo) → /verify → /vault
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
