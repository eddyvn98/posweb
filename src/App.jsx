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
import SheetImport from './pages/SheetImport'
import PriceTagPrint from './pages/PriceTagPrint'
import TikTokPrintK80 from './pages/TikTokPrintK80'
import Cashbook from './pages/Cashbook'
import Settings from './pages/Settings'
import CartBar from './components/CartBar'
import Layout from './components/Layout'

function App() {
    const showTestConsole = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_CONSOLE === 'true'

    return (
        <BrowserRouter>
            <AuthProvider>
                <SyncProvider>
                    <CartProvider>
                        <NotificationProvider>
                            <DriveProvider>
                                <CartBar />
                                {showTestConsole && <TestConsole />}
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

                                    <Route path="/imports-sheet" element={
                                        <ProtectedRoute>
                                            <Layout><SheetImport /></Layout>
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/price-tags" element={
                                        <ProtectedRoute>
                                            <Layout><PriceTagPrint /></Layout>
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/tiktok-print" element={
                                        <ProtectedRoute>
                                            <Layout><TikTokPrintK80 /></Layout>
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/shopee-print" element={
                                        <ProtectedRoute>
                                            <Layout><TikTokPrintK80 /></Layout>
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/shipping-print" element={
                                        <ProtectedRoute>
                                            <Layout><TikTokPrintK80 /></Layout>
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
