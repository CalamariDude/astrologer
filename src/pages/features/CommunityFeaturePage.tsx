import React from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';

const GRID_ITEMS = [
  { icon: '\u25CB', title: 'Topic Spaces', description: 'Curated spaces for natal charts, synastry, transits, traditional techniques, houses, and more.' },
  { icon: '\u270E', title: 'Posts & Comments', description: 'Share insights, ask questions, and discuss with threaded comments.' },
  { icon: '\u2609', title: 'Chart Embedding', description: 'Embed interactive natal, synastry, or composite charts directly in your posts.' },
  { icon: '\u25CF', title: 'User Profiles', description: 'Bio, Sun/Moon/Rising, social links, and post history.' },
  { icon: '\u2661', title: 'Follow System', description: 'Follow astrologers whose insights you value. See their posts in your feed.' },
  { icon: '\u2713', title: 'Poster Applications', description: 'Apply to become a poster in moderated spaces. Quality over quantity.' },
  { icon: '\u25B2', title: 'Upvotes', description: 'Upvote helpful posts and comments to surface the best content.' },
  { icon: '\u25A0', title: 'Moderation', description: 'Space-level moderation with reports, flagging, and admin controls.' },
  { icon: '\u25C6', title: 'Notifications', description: 'Get notified for replies, mentions, and activity in spaces you follow.' },
  { icon: '\u2606', title: 'Featured Posts', description: 'Standout posts highlighted by moderators for quality or insight.' },
];

function CommunityMockVisual() {
  return (
    <div className="relative group flex items-center justify-center">
      <div className="absolute -inset-10 bg-gradient-to-br from-blue-500/[0.06] to-indigo-500/[0.03] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
      <div className="relative bg-white rounded-2xl border border-black/[0.08] w-full max-w-sm drop-shadow-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-black/[0.06] bg-black/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-black/70">Natal Charts</span>
            <span className="text-[10px] text-black/25 ml-auto">342 members</span>
          </div>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {[
            { avatar: 'AS', color: 'from-violet-400 to-indigo-500', name: 'AstroSarah', time: '2h', title: 'My Saturn Return Reading', excerpt: 'Just went through my exact Saturn return at 29\u00b0 Pisces. Here\'s what I noticed...', likes: 24, comments: 8, hasChart: true },
            { avatar: 'MK', color: 'from-amber-400 to-orange-500', name: 'MoonKnight', time: '5h', title: 'Moon-Pluto aspects and transformation', excerpt: 'Anyone else with Moon opposite Pluto experiencing intense shifts during this transit?', likes: 18, comments: 12, hasChart: false },
            { avatar: 'JR', color: 'from-emerald-400 to-teal-500', name: 'JupiterRising', time: '8h', title: 'Jupiter in Gemini \u2014 first impressions', excerpt: 'Jupiter just entered Gemini for the first time in 12 years. My 3rd house is lit up...', likes: 31, comments: 15, hasChart: true },
          ].map((post) => (
            <div key={post.title} className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${post.color} flex items-center justify-center text-[10px] font-bold text-white`}>{post.avatar}</div>
                <span className="text-xs font-medium text-black/60">{post.name}</span>
                <span className="text-[10px] text-black/25">{post.time}</span>
              </div>
              <h4 className="text-sm font-semibold text-black/75 mb-1">{post.title}</h4>
              <p className="text-[11px] text-black/40 leading-relaxed mb-2.5">{post.excerpt}</p>
              {post.hasChart && (
                <div className="mb-2.5 h-8 rounded bg-gradient-to-r from-violet-50 to-indigo-50 border border-black/[0.04] flex items-center px-2.5">
                  <span className="text-[9px] text-violet-500/60 font-medium">\u2609 Embedded natal chart</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-[10px] text-black/25">
                <span>\u2191 {post.likes}</span>
                <span>\u2192 {post.comments} replies</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommunityFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Community"
      tag="Community"
      title="A place for real astrological discussion."
      description="Topic-based spaces where you can share charts, ask questions, and learn from other astrologers. No algorithm \u2014 just good conversation."
      gradient="bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent"
    >
      <FeatureShowcase
        tag="Community"
        headline={<>Share charts.<br className="hidden sm:block" /> Learn together.</>}
        body="Join spaces for natal charts, synastry, traditional techniques, and more. Embed interactive charts in your posts, follow astrologers whose work you admire, and upvote what's genuinely helpful."
        visual={<CommunityMockVisual />}
      />

      <FeatureGrid items={GRID_ITEMS} columns={3} />
    </FeaturePageLayout>
  );
}
