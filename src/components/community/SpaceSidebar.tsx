import { useNavigate } from 'react-router-dom';
import type { CommunitySpace } from '@/hooks/useCommunityFeed';

interface SpaceSidebarProps {
  spaces: CommunitySpace[];
  activeSlug?: string;
}

const SpaceSidebar = ({ spaces, activeSlug }: SpaceSidebarProps) => {
  const navigate = useNavigate();
  const currentSlug = activeSlug || 'all';

  return (
    <div className="w-full lg:w-56 shrink-0">
      <div className="sticky top-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Spaces</h3>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          <button
            onClick={() => navigate('/community')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              currentSlug === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
            }`}
          >
            <span>🌐</span><span>All</span>
          </button>
          {spaces.map(space => (
            <button
              key={space.id}
              onClick={() => navigate(`/community/${space.slug}`)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                currentSlug === space.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
              }`}
            >
              <span>{space.icon || '💬'}</span><span>{space.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SpaceSidebar;
