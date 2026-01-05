import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { DriveProvider } from './contexts/DriveContext'
import ProtectedRoute from './components/ProtectedRoute'
import TestConsole from './components/TestConsole'
import Login from './pages/Login'
import Home from './pages/Home'
import Sales from './pages/Sales'
import Products from './pages/Products'
import History from './pages/History'
import Reports from './pages/Reports'
import Imports from './pages/Imports'
import Cashbook from './pages/Cashbook'
import Settings from './pages/Settings'
import CartBar from './components/CartBar'
import Layout from './components/Layout'

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SyncProvider>
                    <CartProvider>
                        <NotificationProvider>
                            <DriveProvider>
                                <CartBar />
                                <TestConsole />
                                <Routes>
                                <Route path="/login" element={<Login />} />

                                <Route path="/" element={<Navigate to="/sales" replace />} />

                                <Route path="/dashboard" element={
                                    <ProtectedRoute>
                                        <Layout><Home /></Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/sales" element={
                                    <ProtectedRoute>
                                        <Layout><Sales /></Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/products" element={
                                    <ProtectedRoute>
                                        <Layout><Products /></Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/history" element={
                                    <ProtectedRoute>
                                        <Layout><History /></Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/reports" element={
                                    <ProtectedRoute>
                                        <Layout><Reports /></Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/imports" element={
                                    <ProtectedRoute>
                                        <Layout><Imports /></Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/cashbook" element={
                                    <ProtectedRoute>
                                        <Layout><Cashbook /></Layout>
                                    </ProtectedRoute>
                                } />

                                <Route path="/settings" element={
                                    <ProtectedRoute>
                                        <Layout><Settings /></Layout>
                                    </ProtectedRoute>
                                } />

                                {/* Catch all - redirect to home (which redirects to login if needed) */}
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
