import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import HomePage from './pages/HomePage';
import ChartPage from './pages/ChartPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';

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
      </Routes>
    </>
  );
}

export default App;
