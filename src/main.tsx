import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PostHogProvider } from '@posthog/react';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import App from './App';
import './index.css';

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={posthogOptions}
    >
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <App />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
);
