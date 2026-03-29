import React from 'react';
import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer className="relative z-10 bg-background border-t border-border/50 py-8 sm:py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Astrologer</div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link to="/chart" className="hover:text-foreground transition-colors">Chart Tool</Link>
            <Link to="/features/charts" className="hover:text-foreground transition-colors">Features</Link>
            <a href="#learn" className="hover:text-foreground transition-colors">Learn</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/astrologers" className="hover:text-foreground transition-colors">Find an Astrologer</Link>
            <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground/60 border-t border-border/40 pt-5">
          <div>&copy; {new Date().getFullYear()} Astrologer.</div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground/70 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground/70 transition-colors">Privacy</Link>
            <Link to="/support" className="hover:text-foreground/70 transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
