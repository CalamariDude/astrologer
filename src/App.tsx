import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import HomePage from './pages/HomePage';
import ChartPage from './pages/ChartPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SupportPage from './pages/SupportPage';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<Navigate to="/chart" replace />} />
        <Route path="/chart" element={<ChartPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
    </>
  );
}

export default App;
