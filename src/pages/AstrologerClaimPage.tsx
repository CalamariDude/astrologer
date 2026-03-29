import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ClaimInfo {
  id: string;
  display_name: string;
  headline: string | null;
  photo_url: string | null;
  specialties: string[];
}

export default function AstrologerClaimPage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [info, setInfo] = useState<ClaimInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    supabase.functions
      .invoke('astrologer-practitioner-claim', { body: { action: 'verify_token', token } })
      .then(({ data, error: err }) => {
        if (err || data?.error) {
          setError(data?.error || err?.message || 'Invalid or expired claim link.');
        } else {
          setInfo(data.practitioner);
        }
        setLoading(false);
      });
  }, [token]);

  const handleClaim = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setClaiming(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('astrologer-practitioner-claim', {
        body: { action: 'claim', token },
      });
      if (err || data?.error) throw new Error(data?.error || err?.message);
      toast.success('Profile claimed! Redirecting to your profile...');
      navigate(`/astrologers/${data.slug}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClaiming(false);
    }
  };

  // After auth, auto-claim
  useEffect(() => {
    if (user && info && !claiming) {
      // User just logged in and we have info — they can click claim
    }
  }, [user]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-destructive text-center">{error}</p>
        <Link to="/astrologers" className="text-sm text-primary hover:underline">Browse the directory</Link>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border border-border/50 rounded-2xl p-8 text-center">
        {info.photo_url ? (
          <img src={info.photo_url} alt={info.display_name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground mx-auto mb-4">
            {info.display_name.charAt(0)}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-1">{info.display_name}</h1>
        {info.headline && <p className="text-muted-foreground mb-4">{info.headline}</p>}

        {info.specialties.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            {info.specialties.map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-primary/5 text-primary/70 border border-primary/10">
                {s}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          Is this you? Claim this profile to manage your listing, update your bio, and connect with clients.
        </p>

        {user ? (
          <Button size="lg" className="w-full" onClick={handleClaim} disabled={claiming}>
            {claiming ? 'Claiming...' : 'Yes, Claim This Profile'}
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={() => setShowAuth(true)}>
            Sign In to Claim
          </Button>
        )}

        <Link to="/astrologers" className="block mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Back to directory
        </Link>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
