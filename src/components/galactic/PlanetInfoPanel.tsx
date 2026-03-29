/**
 * PlanetInfoPanel
 * Rich info panel: astrological interpretation first, then NASA data.
 * Shows dignity badge, planet-in-sign meaning, house meaning,
 * sign keywords, aspect interpretations, and NASA reference data.
 */

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Planet3D, Aspect3D } from './types';
import { ASPECTS, ASTEROIDS } from '../biwheel/utils/constants';
import { PLANET_NASA_DATA, PLANET_COLORS_3D, getPlanetDignity, DIGNITY_INFO, HOUSE_MEANINGS } from './constants';
import { calculateDegreeSign } from '../biwheel/utils/chartMath';
import { PLANETS as ASTRO_PLANETS } from '@/data/astrologyEducation';
import { SIGN_LENS_KEYWORDS, LENS_ORDER, LENS_CONFIG } from '@/data/signKeywords';
import { getAspectInterpretation } from '@/lib/interpretationLookup';

interface PlanetInfoPanelProps {
  planet: Planet3D;
  aspects: Aspect3D[];
  onClose: () => void;
}

/** Collapsible section wrapper */
function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  color?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
      >
        {title}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

/** Small stat pill */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded px-2 py-1">
      <span className="text-muted-foreground block text-[11px]">{label}</span>
      <span className="font-medium text-xs leading-tight block">{value}</span>
    </div>
  );
}

export function PlanetInfoPanel({ planet, aspects, onClose }: PlanetInfoPanelProps) {
  const [showAspects, setShowAspects] = useState(true);
  const [expandedAspect, setExpandedAspect] = useState<string | null>(null);

  const relatedAspects = aspects.filter(
    (a) => a.planetA === planet.key || a.planetB === planet.key,
  );

  const nasaData = PLANET_NASA_DATA[planet.key];
  const asteroidData = (ASTEROIDS as Record<string, { description?: string }>)[planet.key];
  const deg = calculateDegreeSign(planet.longitude);
  const realColor = PLANET_COLORS_3D[planet.key] ?? planet.color;

  // Astrological data
  const astroInfo = ASTRO_PLANETS[planet.key as keyof typeof ASTRO_PLANETS] ??
    ASTRO_PLANETS[planet.key.replace('transit_', '') as keyof typeof ASTRO_PLANETS];
  const dignity = getPlanetDignity(planet.key.replace('transit_', ''), planet.sign);
  const dignityMeta = dignity ? DIGNITY_INFO[dignity] : null;
  const signKeywords = planet.sign ? SIGN_LENS_KEYWORDS[planet.sign] : null;
  const houseMeaning = planet.house ? HOUSE_MEANINGS[planet.house] : null;

  const formatDegree = (lng: number) => {
    const d = Math.floor(lng % 30);
    const min = Math.floor((lng % 1) * 60);
    return `${d}°${min}'`;
  };

  const hasPhysical = nasaData && (nasaData.diameter || nasaData.mass || nasaData.density || nasaData.gravity || nasaData.temperature || nasaData.escapeVelocity);
  const hasOrbital = nasaData && (nasaData.orbitalPeriod || nasaData.rotationPeriod || nasaData.axialTilt || nasaData.distance);

  return (
    <div className="absolute top-4 right-4 z-50 w-80 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border rounded-xl shadow-2xl scrollbar-thin">
      {/* NASA Image */}
      {nasaData?.imageUrl && (
        <div className="relative w-full h-40 overflow-hidden rounded-t-xl">
          <img
            src={nasaData.imageUrl}
            alt={planet.name}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, var(--background) 0%, transparent 60%)`,
            }}
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl"
              style={{ color: realColor, textShadow: `0 0 12px ${realColor}60` }}
            >
              {planet.symbol}
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm">{planet.name}</h3>
                {planet.retrograde && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: '#c41e3a20',
                      color: '#c41e3a',
                      border: '1px solid #c41e3a40',
                    }}
                  >
                    ℞ RETRO
                  </span>
                )}
                {dignityMeta && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${dignityMeta.color}20`,
                      color: dignityMeta.color,
                      border: `1px solid ${dignityMeta.color}40`,
                    }}
                    title={dignityMeta.description}
                  >
                    {dignityMeta.symbol} {dignityMeta.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDegree(planet.longitude)} {planet.sign}
                {planet.house ? ` · House ${planet.house}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Quick stats row ── */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {planet.house && (
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <span className="text-muted-foreground block text-[11px]">House</span>
              <p className="font-medium">{planet.house}</p>
            </div>
          )}
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <span className="text-muted-foreground block text-[11px]">Degree</span>
            <p className="font-medium">{deg.degreeSymbol} {deg.degreeSign}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <span className="text-muted-foreground block text-[11px]">Category</span>
            <p className="font-medium capitalize">{planet.category}</p>
          </div>
        </div>

        {/* ── Astrological Meaning (PRIORITY — shown first and open) ── */}
        {astroInfo && (
          <Section title="In Your Chart" defaultOpen={true}>
            <p className="text-sm leading-relaxed text-foreground/90">
              {astroInfo.simpleDesc}
            </p>
            {planet.sign && (
              <div
                className="text-xs rounded-lg px-2.5 py-2 border mt-1"
                style={{ borderColor: `${realColor}25`, background: `${realColor}06` }}
              >
                <span className="font-semibold text-foreground/80">
                  {planet.name} in {planet.sign}:
                </span>{' '}
                <span className="text-muted-foreground">
                  {astroInfo.expertDesc}
                </span>
              </div>
            )}
            {astroInfo.keywords && (
              <div className="flex flex-wrap gap-1 mt-1">
                {astroInfo.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Dignity explanation ── */}
        {dignityMeta && (
          <div
            className="text-xs rounded-lg px-2.5 py-1.5 border"
            style={{ borderColor: `${dignityMeta.color}30`, background: `${dignityMeta.color}08` }}
          >
            <span style={{ color: dignityMeta.color }} className="font-semibold">
              {dignityMeta.symbol} {dignityMeta.label}:
            </span>{' '}
            <span className="text-muted-foreground">
              {planet.name} in {planet.sign} is in {dignity}. {dignityMeta.description}.
            </span>
          </div>
        )}

        {/* ── House meaning ── */}
        {houseMeaning && (
          <Section title={`${houseMeaning.name} — ${houseMeaning.keywords}`} defaultOpen={true}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {planet.name} in the {houseMeaning.name}: {houseMeaning.domain}.
              This placement channels your {planet.name.toLowerCase()} energy through {houseMeaning.keywords.toLowerCase()}.
            </p>
          </Section>
        )}

        {/* ── Sign Keywords (by lens) ── */}
        {signKeywords && (
          <Section title={`${planet.sign} Energy`} defaultOpen={false}>
            <p className="text-[11px] text-muted-foreground mb-1">{signKeywords.quality}</p>
            <div className="space-y-1.5">
              {LENS_ORDER.slice(0, 3).map((lens) => {
                const config = LENS_CONFIG[lens];
                const keywords = signKeywords.lenses[lens];
                if (!keywords?.length) return null;
                return (
                  <div key={lens}>
                    <span className="text-[10px] font-semibold" style={{ color: config.color }}>
                      {config.label}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {keywords.slice(0, 6).map((kw) => (
                        <span
                          key={kw}
                          className="text-[9px] px-1 py-0.5 rounded bg-muted/40 text-muted-foreground"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Retrograde notice ── */}
        {planet.retrograde && (
          <div
            className="text-xs rounded-lg px-2.5 py-1.5 border"
            style={{ borderColor: '#c41e3a30', background: '#c41e3a08' }}
          >
            <span style={{ color: '#c41e3a' }} className="font-semibold">Retrograde: </span>
            <span className="text-muted-foreground">
              {planet.name} appears to move backward — a time for reflection, review, and inner work in {planet.sign} themes.
            </span>
          </div>
        )}

        {/* ── Aspects with interpretations ── */}
        {relatedAspects.length > 0 && (
          <div className="space-y-1.5">
            <button
              onClick={() => setShowAspects((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
            >
              Aspects ({relatedAspects.length})
              {showAspects ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showAspects && (
              <div className="space-y-1">
                {relatedAspects.map((asp) => {
                  const otherPlanet = asp.planetA === planet.key ? asp.planetB : asp.planetA;
                  const otherKey = otherPlanet.replace('transit_', '');
                  const strength = asp.aspect.strength;
                  const aspDef = ASPECTS[asp.aspect.type as keyof typeof ASPECTS];
                  const isExpanded = expandedAspect === asp.id;

                  // Look up interpretation
                  const interp = getAspectInterpretation(
                    planet.key.replace('transit_', ''),
                    otherKey,
                    asp.aspect.type,
                  );

                  return (
                    <div key={asp.id}>
                      <button
                        onClick={() => setExpandedAspect(isExpanded ? null : asp.id)}
                        className="flex items-center gap-2 text-sm p-1.5 rounded-md hover:bg-muted/50 transition-colors w-full text-left"
                      >
                        <div
                          className="w-1 h-6 rounded-full flex-shrink-0"
                          style={{
                            background: `linear-gradient(to top, ${asp.energy.color}20, ${asp.energy.color})`,
                            opacity: 0.3 + strength * 0.7,
                          }}
                        />
                        <span style={{ color: asp.energy.color }} className="text-sm w-5 text-center flex-shrink-0">
                          {aspDef?.symbol || '?'}
                        </span>
                        <span className="flex-1 capitalize">{otherKey}</span>
                        <span className="text-muted-foreground text-xs">
                          {asp.aspect.exactOrb}°
                        </span>
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              asp.aspect.nature === 'harmonious' ? '#00bcd4' :
                              asp.aspect.nature === 'challenging' ? '#c41e3a' :
                              '#daa520',
                          }}
                        />
                        {interp && (
                          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {/* Expanded aspect interpretation */}
                      {isExpanded && interp && (
                        <div
                          className="ml-8 mr-1 mb-1.5 rounded-lg px-2.5 py-2 text-xs border"
                          style={{ borderColor: `${asp.energy.color}20`, background: `${asp.energy.color}06` }}
                        >
                          <p className="font-semibold text-foreground/80 mb-1">
                            {interp.title}
                          </p>
                          <p className="text-muted-foreground leading-relaxed">
                            {interp.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── NASA Description ── */}
        {nasaData && (
          <Section title="About This Celestial Body" defaultOpen={false}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {nasaData.description}
            </p>
          </Section>
        )}

        {/* ── Physical Properties ── */}
        {hasPhysical && (
          <Section title="Physical Properties" defaultOpen={false}>
            <div className="grid grid-cols-3 gap-1.5">
              {nasaData.diameter && <Stat label="Diameter" value={nasaData.diameter} />}
              {nasaData.mass && <Stat label="Mass" value={nasaData.mass} />}
              {nasaData.density && <Stat label="Density" value={nasaData.density} />}
              {nasaData.gravity && <Stat label="Gravity" value={nasaData.gravity} />}
              {nasaData.temperature && <Stat label="Temperature" value={nasaData.temperature} />}
              {nasaData.escapeVelocity && <Stat label="Escape Vel." value={nasaData.escapeVelocity} />}
              {nasaData.moons && <Stat label="Moons" value={nasaData.moons} />}
            </div>
          </Section>
        )}

        {/* ── Orbital Info ── */}
        {hasOrbital && (
          <Section title="Orbit & Rotation" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-1.5">
              {nasaData.distance && <Stat label="Distance" value={nasaData.distance} />}
              {nasaData.orbitalPeriod && <Stat label="Orbital Period" value={nasaData.orbitalPeriod} />}
              {nasaData.rotationPeriod && <Stat label="Rotation" value={nasaData.rotationPeriod} />}
              {nasaData.axialTilt && <Stat label="Axial Tilt" value={nasaData.axialTilt} />}
            </div>
          </Section>
        )}

        {/* ── Mythology ── */}
        {nasaData?.mythology && (
          <Section title="Mythology" defaultOpen={false}>
            <div className="text-xs text-muted-foreground leading-relaxed italic">
              {nasaData.mythology}
            </div>
          </Section>
        )}

        {/* ── Asteroid Astrological Meaning ── */}
        {asteroidData?.description && (
          <Section title="Astrological Meaning" defaultOpen={false}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {asteroidData.description}
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
