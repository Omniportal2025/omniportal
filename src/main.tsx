import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import LoginPage from './auth/loginpage'
import AdminDashboard from './components/admin/admindashboard'
import DashboardContent from './components/admin/dashboard/dashboardcontent'
import InventoryPage from './components/admin/inventory/inventorycontent'
import ClientsPage from './components/admin/clients/clientscontent'
import PaymentPage from './components/admin/payment/paymentcontent'
import ClientDashboardPage from './components/client/clientdashboard'
import TicketPage from './components/admin/ticket/ticketcontent'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import AgentDashboard from './components/agent/agentdashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/components/admin/admindashboard" element={<AdminDashboard />} />
        <Route path="/components/admin/dashboard/dashboardcontent" element={<DashboardContent />} />
        <Route path="/components/admin/inventory/inventorycontent" element={<InventoryPage/>} />
        <Route path="/components/admin/clients/clientscontent" element={<ClientsPage/>} />
        <Route path="/components/admin/payment/paymentcontent" element={<PaymentPage/>} />
        <Route path="/components/client/clientdashboard" element={<ClientDashboardPage/>} />
        <Route path="/components/admin/ticket/ticketcontent" element={<TicketPage/>} />
        <Route path="/components/ForgotPassword" element={<ForgotPassword/>} />
        <Route path="/reset-password" element={<ResetPassword/>} />
        <Route path="/components/agent/agentdashboard" element={<AgentDashboard/>} />
      </Routes>
    </Router>
  </StrictMode>,
)
