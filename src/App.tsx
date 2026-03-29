import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { usePostHogIdentify } from '@/lib/posthog';
import HomePage from './pages/HomePage';

// Lazy-load heavy pages so the landing page bundle stays small
const ChartPage = lazy(() => import('./pages/ChartPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const SessionPage = lazy(() => import('./pages/SessionPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ChartsPage = lazy(() => import('./pages/ChartsPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const MarketsPage = lazy(() => import('./pages/MarketsPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const CommunityProfilePage = lazy(() => import('./pages/CommunityProfilePage'));
const CelebrityChartsPage = lazy(() => import('./pages/CelebrityChartsPage'));

// Feature landing pages
const ChartsFeaturePage = lazy(() => import('./pages/features/ChartsFeaturePage'));
const SynastryFeaturePage = lazy(() => import('./pages/features/SynastryFeaturePage'));
const GalacticFeaturePage = lazy(() => import('./pages/features/GalacticFeaturePage'));
const AdvancedFeaturePage = lazy(() => import('./pages/features/AdvancedFeaturePage'));
const SessionsFeaturePage = lazy(() => import('./pages/features/SessionsFeaturePage'));
const MarketsFeaturePage = lazy(() => import('./pages/features/MarketsFeaturePage'));
const CommunityFeaturePage = lazy(() => import('./pages/features/CommunityFeaturePage'));
const CelebrityChartsFeaturePage = lazy(() => import('./pages/features/CelebrityChartsFeaturePage'));
const WaitlistPage = lazy(() => import('./pages/WaitlistPage'));
const InsightPage = lazy(() => import('./pages/InsightPage'));
const ReadingPage = lazy(() => import('./pages/ReadingPage'));

// Blog
const BlogIndexPage = lazy(() => import('./pages/blog/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./pages/blog/BlogPostPage'));

// Astrologer Directory
const AstrologerDirectoryPage = lazy(() => import('./pages/AstrologerDirectoryPage'));
const AstrologerProfilePage = lazy(() => import('./pages/AstrologerProfilePage'));
const AstrologerClaimPage = lazy(() => import('./pages/AstrologerClaimPage'));

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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/session/:token" element={<SessionPage />} />
          <Route path="/celebrities" element={<CelebrityChartsPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/post/:postId" element={<PostDetailPage />} />
          <Route path="/community/profile/:userId" element={<CommunityProfilePage />} />
          <Route path="/community/:spaceSlug" element={<CommunityPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/insight/:moduleSlug" element={<InsightPage />} />
          <Route path="/reading/:readingId" element={<ReadingPage />} />
          {/* Feature landing pages */}
          <Route path="/features/charts" element={<ChartsFeaturePage />} />
          <Route path="/features/compatibility" element={<SynastryFeaturePage />} />
          <Route path="/features/3d" element={<GalacticFeaturePage />} />
          <Route path="/features/advanced" element={<AdvancedFeaturePage />} />
          <Route path="/features/sessions" element={<SessionsFeaturePage />} />
          <Route path="/features/financial" element={<MarketsFeaturePage />} />
          <Route path="/features/community" element={<CommunityFeaturePage />} />
          <Route path="/features/celebrities" element={<CelebrityChartsFeaturePage />} />
          {/* Blog */}
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          {/* Astrologer Directory */}
          <Route path="/astrologers" element={<AstrologerDirectoryPage />} />
          <Route path="/astrologers/claim/:token" element={<AstrologerClaimPage />} />
          <Route path="/astrologers/:slug" element={<AstrologerProfilePage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
