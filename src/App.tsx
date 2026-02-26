import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { usePostHogIdentify } from '@/lib/posthog';
import HomePage from './pages/HomePage';

// Lazy-load heavy pages so the landing page bundle stays small
const ChartPage = lazy(() => import('./pages/ChartPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

function App() {
  // Tie PostHog sessions to authenticated Supabase users
  usePostHogIdentify();

  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new" element={<Navigate to="/chart" replace />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
