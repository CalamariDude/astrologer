import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { PostHogProvider } from '@posthog/react';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import App from './App';
import './index.css';

const IS_PRODUCTION = window.location.hostname === 'astrologer.app'
  || window.location.hostname === 'www.astrologer.app';

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  // Only capture in production — filters out all dev/localhost noise
  autocapture: IS_PRODUCTION,
  capture_pageview: IS_PRODUCTION,
  capture_pageleave: IS_PRODUCTION,
  // Disable entirely in dev so no events fire at all
  ...(IS_PRODUCTION ? {} : { opt_out_capturing_by_default: true }),
} as const;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={posthogOptions}
    >
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
              <App />
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </PostHogProvider>
  </React.StrictMode>
);
