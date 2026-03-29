import React, { useState } from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { useFadeIn } from '@/hooks/useFadeIn';
import { ZODIAC_GLYPHS } from '@/components/landing/zodiacGlyphs';

const GRID_ITEMS = [
  { icon: '\u25CB', title: 'Live Chart Sharing', description: 'Your client sees every chart movement in real-time as you navigate placements.' },
  { icon: '\u25CF', title: 'Audio Recording', description: 'Full session audio captured and stored with your replay for reference.' },
  { icon: '\u2606', title: 'AI Transcription', description: 'Automatic speech-to-text transcription with speaker identification.', pro: true },
  { icon: '\u270E', title: 'AI Summary', description: 'AI-generated session summary with key themes, placements discussed, and action items.', pro: true },
  { icon: '\u25A0', title: 'Chapter Markers', description: 'AI-generated chapters segmenting your reading by topic for easy navigation.' },
  { icon: '\u25B6', title: 'Replay Player', description: 'Full replay with synced audio, chart state, and cursor movements.' },
  { icon: '\u25C6', title: 'Shareable Replay Links', description: 'Send your client a link to watch the replay anytime — no account needed.' },
  { icon: '\u2192', title: 'Remote Cursor Tracking', description: 'Your cursor appears on the client\'s screen to guide them through the chart.' },
  { icon: '\u25A1', title: 'Video Feeds', description: 'Optional webcam feeds for both astrologer and client during the session.' },
  { icon: '\u25B3', title: 'Playback Speed Control', description: 'Review recordings at 1x, 1.5x, or 2x speed.' },
];

function LiveSessionDemo() {
  const [replayTab, setReplayTab] = useState<'Chapters' | 'Transcript' | 'Summary'>('Chapters');
  const fade = useFadeIn();

  return (
    <section className="relative py-32 sm:py-44 md:py-56 px-4 sm:px-6 overflow-hidden bg-background">
      <style>{`
        @keyframes cursorDrift {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(12px, -8px); }
          40% { transform: translate(-6px, -18px); }
          60% { transform: translate(18px, 4px); }
          80% { transform: translate(-10px, 10px); }
        }
        @keyframes videoFeedFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes controlsGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0); }
          50% { box-shadow: 0 0 20px 2px rgba(244,63,94,0.1); }
        }
        @keyframes replayProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-rose-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div ref={fade.ref} style={fade.style} className={`relative max-w-7xl mx-auto flex flex-col items-center gap-20 sm:gap-28 ${fade.className}`}>
        {/* Header */}
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-rose-500/80">
            Pro — Live Sessions
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-500 rounded border border-rose-500/20">New</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
              Deliver readings.<br className="hidden sm:block" /> Live.
            </span>
          </h2>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl leading-relaxed text-foreground/50 max-w-xl mx-auto">
            Conduct a live consultation with your client. Share your chart in real-time, talk through it together, and record everything — chart movements, audio, and your cursor — for instant replay.
          </p>
        </div>

        {/* Client's Live View */}
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8 sm:mb-10">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-foreground/30 mb-2">What your client sees</div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">The chart, live. Your cursor guiding them.</h3>
          </div>
          <div className="relative group">
            <div className="absolute -inset-12 bg-gradient-to-br from-rose-500/[0.06] via-orange-500/[0.03] to-transparent rounded-[3rem] blur-3xl opacity-70" />
            <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-br from-rose-500/15 via-orange-500/8 to-amber-500/15 opacity-50" />
            <div className="relative bg-white rounded-2xl border border-black/[0.08] overflow-hidden drop-shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/[0.06] bg-black/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-black/50">Live Session — Sarah's Natal Reading</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-black/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>24:37</span>
                </div>
              </div>

              {/* Chart area */}
              <div className="relative p-4 sm:p-8 min-h-[300px] sm:min-h-[420px]">
                <div className="flex items-center justify-center">
                  <svg viewBox="0 0 400 400" className="w-[260px] h-[260px] sm:w-[340px] sm:h-[340px]" style={{ animation: 'spin 180s linear infinite' }}>
                    {[
                      { color: '#fff0e6', text: '#cc5500' }, { color: '#e6f5ed', text: '#228855' },
                      { color: '#fff8e6', text: '#aa8800' }, { color: '#e6f2ff', text: '#2288bb' },
                      { color: '#fff0e6', text: '#cc5500' }, { color: '#e6f5ed', text: '#228855' },
                      { color: '#fff8e6', text: '#aa8800' }, { color: '#e6f2ff', text: '#2288bb' },
                      { color: '#fff0e6', text: '#cc5500' }, { color: '#e6f5ed', text: '#228855' },
                      { color: '#fff8e6', text: '#aa8800' }, { color: '#e6f2ff', text: '#2288bb' },
                    ].map((seg, i) => {
                      const startAngle = i * 30 - 90;
                      const endAngle = startAngle + 30;
                      const r1 = 175, r2 = 195;
                      const sa = (startAngle * Math.PI) / 180;
                      const ea = (endAngle * Math.PI) / 180;
                      const ma = ((startAngle + 15) * Math.PI) / 180;
                      const cx = 200 + 185 * Math.cos(ma);
                      const cy = 200 + 185 * Math.sin(ma);
                      return (
                        <g key={i}>
                          <path
                            d={`M${200+r1*Math.cos(sa)},${200+r1*Math.sin(sa)} A${r1},${r1} 0 0,1 ${200+r1*Math.cos(ea)},${200+r1*Math.sin(ea)} L${200+r2*Math.cos(ea)},${200+r2*Math.sin(ea)} A${r2},${r2} 0 0,0 ${200+r2*Math.cos(sa)},${200+r2*Math.sin(sa)} Z`}
                            fill={seg.color} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5"
                          />
                          <g transform={`translate(${cx - 6}, ${cy - 6})`} opacity="0.8">
                            <path d={ZODIAC_GLYPHS[i]} fill="none" stroke={seg.text} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                        </g>
                      );
                    })}
                    <circle cx="200" cy="200" r="195" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    <circle cx="200" cy="200" r="175" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => {
                      const rad = (a - 90) * Math.PI / 180;
                      return <line key={a} x1={200+80*Math.cos(rad)} y1={200+80*Math.sin(rad)} x2={200+175*Math.cos(rad)} y2={200+175*Math.sin(rad)} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />;
                    })}
                    <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
                    <circle cx="200" cy="200" r="148" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
                    {[
                      { glyph: '\u2609', angle: 340, color: '#FFB300' },
                      { glyph: '\u263D', angle: 25, color: '#9E9E9E' },
                      { glyph: '\u263F', angle: 355, color: '#FDD835' },
                      { glyph: '\u2640', angle: 310, color: '#F48FB1' },
                      { glyph: '\u2642', angle: 145, color: '#E53935' },
                      { glyph: '\u2643', angle: 72, color: '#7E57C2' },
                      { glyph: '\u2644', angle: 260, color: '#8D6E63' },
                      { glyph: '\u2645', angle: 50, color: '#42A5F5' },
                      { glyph: '\u2646', angle: 0, color: '#4DD0E1' },
                      { glyph: '\u2647', angle: 298, color: '#78909C' },
                    ].map((p, i) => {
                      const rad = (p.angle - 90) * Math.PI / 180;
                      return <text key={i} x={200+148*Math.cos(rad)} y={200+148*Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill={p.color} fontSize="13" fontFamily="serif">{p.glyph}</text>;
                    })}
                    {[
                      { a1: 340, a2: 25, color: '#c41e3a', dash: '3 2' },
                      { a1: 340, a2: 145, color: '#00bcd4', dash: '' },
                      { a1: 25, a2: 260, color: '#c41e3a', dash: '3 2' },
                      { a1: 310, a2: 72, color: '#00bcd4', dash: '' },
                      { a1: 355, a2: 0, color: '#daa520', dash: '' },
                      { a1: 50, a2: 310, color: '#1e5aa8', dash: '' },
                    ].map((asp, i) => {
                      const r = 75;
                      const r1 = (asp.a1 - 90) * Math.PI / 180;
                      const r2 = (asp.a2 - 90) * Math.PI / 180;
                      return <line key={i} x1={200+r*Math.cos(r1)} y1={200+r*Math.sin(r1)} x2={200+r*Math.cos(r2)} y2={200+r*Math.sin(r2)} stroke={asp.color} strokeWidth="0.7" strokeDasharray={asp.dash} opacity="0.35" />;
                    })}
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((h) => {
                      const rad = ((h-1)*30 + 15 - 90) * Math.PI / 180;
                      return <text key={h} x={200+125*Math.cos(rad)} y={200+125*Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill="rgba(0,0,0,0.15)" fontSize="9">{h}</text>;
                    })}
                  </svg>
                </div>

                {/* Remote cursor */}
                <div className="absolute" style={{ left: '58%', top: '52%', animation: 'cursorDrift 8s ease-in-out infinite' }}>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400 drop-shadow-lg -rotate-6">
                      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    </svg>
                    <div className="absolute top-5 left-3 px-2 py-0.5 rounded bg-blue-500 text-[9px] text-white font-medium whitespace-nowrap shadow-lg">Host</div>
                  </div>
                </div>

                {/* Video feeds */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col gap-2" style={{ animation: 'videoFeedFloat 4s ease-in-out infinite' }}>
                  <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-black/[0.08] flex items-center justify-center overflow-hidden shadow-lg">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">JD</div>
                  </div>
                  <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-black/[0.08] flex items-center justify-center overflow-hidden shadow-lg">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">SM</div>
                  </div>
                </div>

                {/* Session controls */}
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/70 border border-black/10 backdrop-blur-sm shadow-2xl" style={{ animation: 'controlsGlow 3s ease-in-out infinite' }}>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white/80"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                    </div>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white/80"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    </div>
                    <div className="w-px h-5 bg-white/15 mx-0.5" />
                    <div className="flex items-center gap-1.5 px-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-mono text-white/60">24:37</span>
                    </div>
                    <div className="w-px h-5 bg-white/15 mx-0.5" />
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500/30 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-rose-300"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-step flow */}
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
            {[
              { step: '1', title: 'Start a session', desc: 'Click Live Session, name your reading, and share the link with your client.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg> },
              { step: '2', title: 'Read the chart together', desc: 'Your client sees every chart movement in real-time — your cursor guides them through the reading.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg> },
              { step: '3', title: 'Replay anytime', desc: 'Audio, chart state, and cursor — all synced. AI generates a transcript, summary, and chapter markers.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
            ].map((s) => (
              <div key={s.step} className="relative text-center sm:text-left p-5 sm:p-6 rounded-2xl bg-black/[0.02] border border-black/[0.06]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-500 mb-4">{s.icon}</div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">{s.title}</h4>
                <p className="text-sm text-foreground/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Replay Player */}
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8 sm:mb-10">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-foreground/30 mb-2">After the session</div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">Every word. Every chart movement. Preserved.</h3>
          </div>
          <div className="relative group">
            <div className="absolute -inset-12 bg-gradient-to-br from-orange-500/[0.04] via-amber-500/[0.03] to-transparent rounded-[3rem] blur-3xl opacity-70" />
            <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/8 to-rose-500/10 opacity-50" />
            <div className="relative bg-white rounded-2xl border border-black/[0.08] overflow-hidden drop-shadow-2xl">
              {/* Replay header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/[0.06] bg-black/[0.02]">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-500"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span className="text-xs sm:text-sm font-medium text-black/60">Sarah's Natal Reading — Feb 24, 2026</span>
                </div>
                <span className="hidden sm:inline text-[10px] text-black/30 uppercase tracking-wider">42 min</span>
              </div>

              <div className="flex flex-col lg:flex-row">
                {/* Left: Waveform */}
                <div className="flex-1 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-black/[0.06]">
                  <div className="flex items-center justify-center mb-6">
                    <svg viewBox="0 0 300 300" className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]">
                      {['#fff0e6','#e6f5ed','#fff8e6','#e6f2ff','#fff0e6','#e6f5ed','#fff8e6','#e6f2ff','#fff0e6','#e6f5ed','#fff8e6','#e6f2ff'].map((color, i) => {
                        const sa = (i * 30 - 90) * Math.PI / 180;
                        const ea = ((i+1) * 30 - 90) * Math.PI / 180;
                        const r1 = 128, r2 = 145;
                        return <path key={i} d={`M${150+r1*Math.cos(sa)},${150+r1*Math.sin(sa)} A${r1},${r1} 0 0,1 ${150+r1*Math.cos(ea)},${150+r1*Math.sin(ea)} L${150+r2*Math.cos(ea)},${150+r2*Math.sin(ea)} A${r2},${r2} 0 0,0 ${150+r2*Math.cos(sa)},${150+r2*Math.sin(sa)} Z`} fill={color} stroke="rgba(0,0,0,0.06)" strokeWidth="0.3" />;
                      })}
                      <circle cx="150" cy="150" r="145" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
                      <circle cx="150" cy="150" r="128" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
                      <circle cx="150" cy="150" r="55" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.3" />
                      {ZODIAC_GLYPHS.map((glyphPath, i) => {
                        const colors = ['#cc5500','#228855','#aa8800','#2288bb','#cc5500','#228855','#aa8800','#2288bb','#cc5500','#228855','#aa8800','#2288bb'];
                        const rad = (i*30+15-90)*Math.PI/180;
                        const cx = 150+136*Math.cos(rad);
                        const cy = 150+136*Math.sin(rad);
                        return (
                          <g key={i} transform={`translate(${cx - 6*0.55}, ${cy - 6*0.55}) scale(0.55)`} opacity="0.6">
                            <path d={glyphPath} fill="none" stroke={colors[i]} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end gap-[2px] h-10">
                      {Array.from({ length: 64 }).map((_, i) => {
                        const heights = [30,55,40,75,35,60,70,25,85,45,65,50,80,30,70,45,55,35,65,50,40,75,45,60,30,70,40,85,50,35,55,65,40,80,45,30,60,50,75,55,35,65,55,40,70,45,80,50,30,60,45,75,35,55,70,40,85,50,65,35,45,60,30,75];
                        const played = i < 38;
                        return <div key={i} className="flex-1 rounded-full" style={{ height: `${heights[i]}%`, backgroundColor: played ? 'rgba(234,88,12,0.4)' : 'rgba(0,0,0,0.06)' }} />;
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-black/50 ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                      </div>
                      <div className="flex-1 h-1 bg-black/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ animation: 'replayProgress 20s linear infinite' }} />
                      </div>
                      <span className="text-[10px] font-mono text-black/30 flex-shrink-0">24:37 / 41:52</span>
                    </div>
                  </div>
                </div>

                {/* Right: Tabs */}
                <div className="lg:w-[380px] flex flex-col">
                  <div className="flex border-b border-black/[0.06]">
                    {(['Chapters', 'Transcript', 'Summary'] as const).map((tab) => (
                      <button key={tab} onClick={() => setReplayTab(tab)}
                        className={`relative flex-1 py-2.5 text-[11px] sm:text-xs font-medium transition-colors ${replayTab === tab ? 'text-amber-600 border-b border-amber-500' : 'text-black/25 hover:text-black/40'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 p-4 space-y-1.5 overflow-hidden" style={{ maxHeight: '340px' }}>
                    {replayTab === 'Chapters' && (
                      <>
                        {[
                          { time: '0:00', title: 'Introduction & birth data', active: false, past: true },
                          { time: '3:22', title: 'Sun in Pisces, 7th House', active: false, past: true },
                          { time: '8:14', title: 'Moon-Venus conjunction', active: false, past: true },
                          { time: '14:50', title: 'Mars square Saturn', active: true, past: false },
                          { time: '22:08', title: 'Jupiter transit to Midheaven', active: false, past: false },
                          { time: '30:15', title: 'Saturn return overview', active: false, past: false },
                          { time: '37:40', title: 'Summary & guidance', active: false, past: false },
                        ].map((ch) => (
                          <div key={ch.time} className={`flex gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${ch.active ? 'bg-amber-500/10 border border-amber-500/15' : 'border border-transparent hover:bg-black/[0.02]'}`}>
                            <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                              <div className={`w-2 h-2 rounded-full ${ch.active ? 'bg-amber-500' : ch.past ? 'bg-black/20' : 'bg-black/[0.08]'}`} />
                              <div className="w-px flex-1 bg-black/[0.06] mt-1" />
                            </div>
                            <div>
                              <span className={`text-[10px] font-mono ${ch.active ? 'text-amber-600' : 'text-black/25'}`}>{ch.time}</span>
                              <div className={`text-xs sm:text-sm font-medium mt-0.5 ${ch.active ? 'text-black/75' : ch.past ? 'text-black/50' : 'text-black/30'}`}>{ch.title}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {replayTab === 'Transcript' && (
                      <div className="space-y-3">
                        {[
                          { time: '0:00', speaker: 'Astrologer', text: "Welcome! Let's take a look at your chart." },
                          { time: '0:32', speaker: 'Astrologer', text: "I'm pulling up your natal chart now. Right away I notice your Sun is in Pisces in the 7th house." },
                          { time: '3:22', speaker: 'Astrologer', text: "This Sun placement tells me that relationships are central to your identity." },
                          { time: '3:58', speaker: 'Client', text: "That resonates a lot. I've always defined myself through my close relationships." },
                          { time: '8:14', speaker: 'Astrologer', text: "This Moon-Venus conjunction means your emotional needs and your love language are deeply aligned." },
                        ].map((line, i) => (
                          <div key={i} className="flex gap-2.5">
                            <span className="text-[10px] font-mono text-black/20 w-8 flex-shrink-0 pt-0.5 text-right">{line.time}</span>
                            <div>
                              <span className={`text-[10px] font-semibold ${line.speaker === 'Astrologer' ? 'text-amber-600/70' : 'text-sky-600/70'}`}>{line.speaker}</span>
                              <p className="text-[11px] sm:text-xs text-black/45 leading-relaxed mt-0.5">{line.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {replayTab === 'Summary' && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-amber-500/70"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                            <span className="text-[11px] font-semibold text-amber-600/80 uppercase tracking-wider">AI Summary</span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-black/45 leading-relaxed">
                            This session explored a Pisces Sun/7th house native with a strong Moon-Venus conjunction in Taurus. The chart emphasizes relational identity, emotional warmth, and a need for stability.
                          </p>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-black/30 uppercase tracking-wider mb-1.5">Key Themes</div>
                          <div className="flex flex-wrap gap-1.5">
                            {['Relationships', 'Emotional Security', 'Career Growth', 'Discipline', 'Saturn Return'].map((theme) => (
                              <span key={theme} className="px-2 py-0.5 rounded-full bg-black/[0.03] border border-black/[0.06] text-[10px] text-black/40">{theme}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <span className="inline-block px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-600 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]">
          Astrologer Pro
        </span>
      </div>
    </section>
  );
}

export default function SessionsFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Live Sessions"
      tag="Sessions"
      title="Deliver readings. Live."
      description="Conduct live consultations with chart sharing, audio recording, AI transcription, and instant replay — everything a professional astrologer needs."
      gradient="bg-gradient-to-br from-rose-500/20 via-orange-500/10 to-transparent"
    >
      <LiveSessionDemo />
      <FeatureGrid items={GRID_ITEMS} columns={3} />
    </FeaturePageLayout>
  );
}
