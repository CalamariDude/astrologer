/**
 * PlanetInfoPanel
 * Rich NASA-sourced info panel with organized sections:
 * image, physical properties, orbital data, atmosphere, features,
 * exploration history, mythology, fun facts, aspects.
 */

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Planet3D, Aspect3D } from './types';
import { ASPECTS, ASTEROIDS } from '../biwheel/utils/constants';
import { PLANET_NASA_DATA, PLANET_COLORS_3D } from './constants';
import { calculateDegreeSign } from '../biwheel/utils/chartMath';

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
  color,
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

  const relatedAspects = aspects.filter(
    (a) => a.planetA === planet.key || a.planetB === planet.key,
  );

  const nasaData = PLANET_NASA_DATA[planet.key];
  const asteroidData = (ASTEROIDS as Record<string, { description?: string }>)[planet.key];
  const deg = calculateDegreeSign(planet.longitude);
  const realColor = PLANET_COLORS_3D[planet.key] ?? planet.color;

  const formatDegree = (lng: number) => {
    const deg = Math.floor(lng % 30);
    const min = Math.floor((lng % 1) * 60);
    return `${deg}°${min}'`;
  };

  const hasPhysical = nasaData && (nasaData.diameter || nasaData.mass || nasaData.density || nasaData.gravity || nasaData.temperature || nasaData.escapeVelocity);
  const hasOrbital = nasaData && (nasaData.orbitalPeriod || nasaData.rotationPeriod || nasaData.axialTilt || nasaData.distance);
  const hasAtmosphere = nasaData && (nasaData.atmosphere || nasaData.composition);
  const hasFeatures = nasaData && (nasaData.surfaceFeatures || nasaData.magneticField || nasaData.rings);
  const hasExploration = nasaData && (nasaData.discoverer || (nasaData.missions && nasaData.missions.length > 0));
  const hasFacts = nasaData && (nasaData.funFact || (nasaData.additionalFacts && nasaData.additionalFacts.length > 0));

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
              <div className="flex items-center gap-1.5">
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
                {nasaData?.classification && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                    {nasaData.classification}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDegree(planet.longitude)} {planet.sign}
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

        {/* ── Retrograde notice ── */}
        {planet.retrograde && (
          <div
            className="text-xs rounded-lg px-2.5 py-1.5 border"
            style={{ borderColor: '#c41e3a30', background: '#c41e3a08' }}
          >
            <span style={{ color: '#c41e3a' }} className="font-semibold">Retrograde: </span>
            <span className="text-muted-foreground">
              {planet.name} appears to move backward through the zodiac from Earth's perspective.
            </span>
          </div>
        )}

        {/* ── Description ── */}
        {nasaData && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {nasaData.description}
          </p>
        )}

        {/* ── Physical Properties ── */}
        {hasPhysical && (
          <Section title="Physical Properties" defaultOpen={true}>
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
          <Section title="Orbit & Rotation" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-1.5">
              {nasaData.distance && <Stat label="Distance" value={nasaData.distance} />}
              {nasaData.orbitalPeriod && <Stat label="Orbital Period" value={nasaData.orbitalPeriod} />}
              {nasaData.rotationPeriod && <Stat label="Rotation" value={nasaData.rotationPeriod} />}
              {nasaData.axialTilt && <Stat label="Axial Tilt" value={nasaData.axialTilt} />}
            </div>
          </Section>
        )}

        {/* ── Atmosphere & Composition ── */}
        {hasAtmosphere && (
          <Section title="Atmosphere & Composition" defaultOpen={false}>
            {nasaData.atmosphere && (
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground/70">Atmosphere: </span>
                {nasaData.atmosphere}
              </div>
            )}
            {nasaData.composition && (
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground/70">Composition: </span>
                {nasaData.composition}
              </div>
            )}
          </Section>
        )}

        {/* ── Surface Features, Magnetic Field, Rings ── */}
        {hasFeatures && (
          <Section title="Key Features" defaultOpen={false}>
            {nasaData.surfaceFeatures && (
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground/70">Surface: </span>
                {nasaData.surfaceFeatures}
              </div>
            )}
            {nasaData.magneticField && (
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground/70">Magnetic Field: </span>
                {nasaData.magneticField}
              </div>
            )}
            {nasaData.rings && (
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground/70">Rings: </span>
                {nasaData.rings}
              </div>
            )}
          </Section>
        )}

        {/* ── Exploration ── */}
        {hasExploration && (
          <Section title="Exploration" defaultOpen={false}>
            {nasaData.discoverer && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/70">Discovered: </span>
                {nasaData.discoverer}
              </div>
            )}
            {nasaData.missions && nasaData.missions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/70 block mb-0.5">Missions:</span>
                <ul className="space-y-0.5 ml-2">
                  {nasaData.missions.map((m, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span style={{ color: realColor }} className="mt-0.5">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

        {/* ── Fun Facts ── */}
        {hasFacts && (
          <Section title="Fun Facts" defaultOpen={false}>
            <div className="space-y-1.5">
              {nasaData.funFact && (
                <div
                  className="text-xs rounded-lg px-2.5 py-1.5 border"
                  style={{ borderColor: `${realColor}30`, background: `${realColor}08` }}
                >
                  <span className="text-muted-foreground">{nasaData.funFact}</span>
                </div>
              )}
              {nasaData.additionalFacts?.map((fact, i) => (
                <div
                  key={i}
                  className="text-xs rounded-lg px-2.5 py-1.5 border"
                  style={{ borderColor: `${realColor}15`, background: `${realColor}05` }}
                >
                  <span className="text-muted-foreground">{fact}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Astrological Meaning (from biwheel asteroid definitions) ── */}
        {asteroidData?.description && (
          <Section title="Astrological Meaning" defaultOpen={false}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {asteroidData.description}
            </p>
          </Section>
        )}

        {/* ── Aspects — collapsible ── */}
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
                  const strength = asp.aspect.strength;
                  const aspDef = ASPECTS[asp.aspect.type as keyof typeof ASPECTS];

                  return (
                    <div
                      key={asp.id}
                      className="flex items-center gap-2 text-sm p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-1 h-6 rounded-full"
                        style={{
                          background: `linear-gradient(to top, ${asp.energy.color}20, ${asp.energy.color})`,
                          opacity: 0.3 + strength * 0.7,
                        }}
                      />
                      <span style={{ color: asp.energy.color }} className="text-sm w-5 text-center">
                        {aspDef?.symbol || '?'}
                      </span>
                      <span className="flex-1 capitalize">{otherPlanet}</span>
                      <span className="text-muted-foreground">
                        {asp.aspect.exactOrb}°
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            asp.aspect.nature === 'harmonious' ? '#00bcd4' :
                            asp.aspect.nature === 'challenging' ? '#c41e3a' :
                            '#daa520',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
