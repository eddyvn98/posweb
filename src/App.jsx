import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { DriveProvider } from './contexts/DriveContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'

// App pages (protected)
import Home from './pages/Home'
import Sales from './pages/Sales'
import Products from './pages/Products'
import History from './pages/History'
import Reports from './pages/Reports'
import Imports from './pages/Imports'
import SheetImport from './pages/SheetImport'
import Cashbook from './pages/Cashbook'
import Settings from './pages/Settings'
import Modules from './pages/Modules'
import WebSales from './pages/WebSales'
import Staff from './pages/Staff'
import Layout from './components/Layout'

function App() {

    return (
        <BrowserRouter>
            <AuthProvider>
                <SyncProvider>
                    <CartProvider>
                        <NotificationProvider>
                            <DriveProvider>

                                <Routes>
                                    {/* ── Public routes ─────────────────────────────── */}
                                    <Route path="/" element={<Landing />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Login />} />
                                    <Route path="/reset-password" element={<ResetPassword />} />

                                    {/* ── Protected app routes ───────────────────────── */}
                                    <Route path="/app" element={
                                        <ProtectedRoute>
                                            <Layout />
                                        </ProtectedRoute>
                                    }>
                                        <Route index element={<Navigate to="/app/sales" replace />} />
                                        <Route path="dashboard" element={<Home />} />
                                        <Route path="sales" element={<Sales />} />
                                        <Route path="products" element={<Products />} />
                                        <Route path="history" element={<History />} />
                                        <Route path="reports" element={<Reports />} />
                                        <Route path="imports" element={<Imports />} />
                                        <Route path="imports-sheet" element={<SheetImport />} />
                                        <Route path="cashbook" element={<Cashbook />} />
                                        <Route path="settings" element={<Settings />} />
                                        <Route path="modules" element={<Modules />} />
                                        <Route path="web-sales" element={<WebSales />} />
                                        <Route path="staff" element={<Staff />} />
                                    </Route>

                                    {/* ── Legacy redirect ────────────────────────────── */}
                                    <Route path="/sales" element={<Navigate to="/app/sales" replace />} />
                                    <Route path="/products" element={<Navigate to="/app/products" replace />} />
                                    <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                                    <Route path="/history" element={<Navigate to="/app/history" replace />} />
                                    <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
                                    <Route path="/imports" element={<Navigate to="/app/imports" replace />} />
                                    <Route path="/cashbook" element={<Navigate to="/app/cashbook" replace />} />

                                    {/* ── Catch all ─────────────────────────────────── */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </DriveProvider>
                        </NotificationProvider>
                    </CartProvider>
                </SyncProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
