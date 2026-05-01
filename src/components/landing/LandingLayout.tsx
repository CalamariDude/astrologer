import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useLightLandingTheme } from '@/hooks/useLightLandingTheme';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';

export function LandingLayout({
  children,
  darkZoneThreshold = 0.55,
}: {
  children: React.ReactNode;
  darkZoneThreshold?: number;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollProgress = useScrollProgress();
  const [showAuth, setShowAuth] = useState(false);
  const [pendingDashboard, setPendingDashboard] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  useLightLandingTheme();

  const inDarkZone = scrollProgress < darkZoneThreshold;

  useEffect(() => {
    if (user && pendingDashboard) {
      setPendingDashboard(false);
      navigate('/dashboard');
    }
  }, [user, pendingDashboard, navigate]);

  const handleOpenApp = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setPendingDashboard(true);
      setShowAuth(true);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#07050F' }}>
      <LandingHeader inDarkZone={inDarkZone} onOpenApp={handleOpenApp} />
      {children}
      <LandingFooter />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
