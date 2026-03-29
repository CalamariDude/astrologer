/**
 * Chart3DWheel — Unique 3D Astrology Experience
 *
 * From top-down: reads like a classic 2D chart (degree° glyph minute' symbol).
 * Orbit to reveal 3D depth:
 *   - Planets float as glowing orbs above the wheel, sized by significance
 *   - Aspect lines lift into arched energy beams when highlighted
 *   - Selected planet emits a pillar of light upward
 *   - Flowing particles along highlighted aspect arcs
 *   - Zodiac ring has subtle 3D thickness
 *
 * No other astrology software does this.
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import { Html, Text, Billboard, Line, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ZODIAC_SIGNS,
  PLANETS,
  ASTEROIDS,
  ARABIC_PARTS,
} from '../biwheel/utils/constants';
import {
  calculateNatalAspects,
  type SynastryAspect,
  type AspectType,
} from '../biwheel/utils/aspectCalculations';
import {
  adjustForCollisions,
  type PlacedPlanet,
  calculateDegreeSign,
} from '../biwheel/utils/chartMath';
import type { GalacticNatalChart } from './types';
import { StarField3D } from './StarField3D';
import { calculateHouseCusps } from '@/lib/houseCalculations';

// ─── Layout Constants ───────────────────────────────────────────────────────────

const ZODIAC_OUTER_R = 10;
const ZODIAC_INNER_R = 8.6;
const ZODIAC_THICKNESS = 0.18; // 3D extrusion — visible when tilted
const SIGN_LABEL_R = (ZODIAC_OUTER_R + ZODIAC_INNER_R) / 2;

// Planet display — 2 rings: compact degree info (inner) + planet symbol (outer)
const PLANET_INFO_R = 7.5;      // combined "14°♈13'" — tight to symbol
const PLANET_SYMBOL_R = 8.1;    // planet symbol "☉" (outer, just inside zodiac)

// Planet orb floats above
const PLANET_ORB_Y = 0.3;

const HOUSE_CUSP_OUTER = ZODIAC_INNER_R;
const HOUSE_CUSP_INNER = 3.8;
const HOUSE_NUM_R = 5.2;
const ASPECT_Y = 0.03;
const ASPECT_CONNECT_R = PLANET_INFO_R;

// Planet significance (determines orb size and glow)
const PLANET_SIGNIFICANCE: Record<string, number> = {
  sun: 1.0, moon: 0.95, ascendant: 0.9, midheaven: 0.85,
  mercury: 0.7, venus: 0.7, mars: 0.7,
  jupiter: 0.65, saturn: 0.65,
  uranus: 0.5, neptune: 0.5, pluto: 0.5,
  northnode: 0.45, southnode: 0.4,
  chiron: 0.35, lilith: 0.35,
};

// Element colors — richer, more saturated for dark background
const ELEMENT_BG_3D: Record<string, string> = {
  fire: '#4a1515', earth: '#154a15', air: '#4a4a15', water: '#15154a',
};
const ELEMENT_EMISSIVE_3D: Record<string, string> = {
  fire: '#FF5555', earth: '#55BB55', air: '#EECC44', water: '#5599FF',
};
const ELEMENT_TEXT_3D: Record<string, string> = {
  fire: '#FF9977', earth: '#88EE88', air: '#FFEE88', water: '#88CCFF',
};

function getSignGlyphColor(longitude: number): string {
  const signIndex = Math.floor(longitude / 30);
  const element = ZODIAC_SIGNS[signIndex]?.element || 'air';
  return ELEMENT_TEXT_3D[element] || '#FFEE88';
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function longitudeTo3D(longitude: number, radius: number, y: number = 0, rotationOffset: number = 0): THREE.Vector3 {
  const angleRad = ((90 + longitude + rotationOffset) * Math.PI) / 180;
  return new THREE.Vector3(radius * Math.cos(angleRad), y, -radius * Math.sin(angleRad));
}

function longitudeToAngleRad(longitude: number, rotationOffset: number = 0): number {
  return ((90 + longitude + rotationOffset) * Math.PI) / 180;
}

function getPlanetInfo(key: string): { symbol: string; name: string; color: string } {
  const planet = PLANETS[key as keyof typeof PLANETS];
  if (planet) return { symbol: planet.symbol, name: planet.name, color: planet.color };
  const arabicPart = (ARABIC_PARTS as Record<string, { symbol: string; name: string; color: string }>)[key];
  if (arabicPart) return { symbol: arabicPart.symbol, name: arabicPart.name, color: arabicPart.color };
  const asteroid = (ASTEROIDS as Record<string, { symbol: string; name: string; color: string }>)[key];
  if (asteroid) return { symbol: asteroid.symbol, name: asteroid.name, color: asteroid.color };
  return { symbol: key.slice(0, 3).toUpperCase(), name: key, color: '#a78bfa' };
}

// ─── Zodiac Ring (with 3D thickness) ────────────────────────────────────────────

function ZodiacSegment({ index, element, rotationOffset }: { index: number; element: string; rotationOffset: number }) {
  const geometry = useMemo(() => {
    const startLong = index * 30;
    const thetaStart = longitudeToAngleRad(startLong, rotationOffset);
    const thetaLength = (30 * Math.PI) / 180;
    const geo = new THREE.RingGeometry(ZODIAC_INNER_R, ZODIAC_OUTER_R, 48, 1, thetaStart, thetaLength);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [index, rotationOffset]);

  return (
    <group>
      {/* Top face — vibrant */}
      <mesh geometry={geometry} position={[0, ZODIAC_THICKNESS / 2, 0]}>
        <meshStandardMaterial
          color={ELEMENT_BG_3D[element] || '#151515'}
          side={THREE.DoubleSide}
          transparent opacity={0.97}
          emissive={ELEMENT_EMISSIVE_3D[element] || '#444444'}
          emissiveIntensity={0.45}
        />
      </mesh>
      {/* Bottom face */}
      <mesh geometry={geometry} position={[0, -ZODIAC_THICKNESS / 2, 0]}>
        <meshStandardMaterial
          color={ELEMENT_BG_3D[element] || '#151515'}
          side={THREE.DoubleSide}
          transparent opacity={0.85}
          emissive={ELEMENT_EMISSIVE_3D[element] || '#444444'}
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

// Outer edge of zodiac ring (gives it visible thickness when tilted)
function ZodiacEdge({ rotationOffset }: { rotationOffset: number }) {
  const outerPoints = useMemo(() => {
    const pts: [THREE.Vector3, THREE.Vector3][] = [];
    for (let deg = 0; deg < 360; deg += 2) {
      const top = longitudeTo3D(deg, ZODIAC_OUTER_R, ZODIAC_THICKNESS / 2, rotationOffset);
      const bottom = longitudeTo3D(deg, ZODIAC_OUTER_R, -ZODIAC_THICKNESS / 2, rotationOffset);
      pts.push([top, bottom]);
    }
    return pts;
  }, [rotationOffset]);

  return (
    <>
      {outerPoints.map((pts, i) => (
        <Line key={i} points={pts} color="#555566" lineWidth={0.3} transparent opacity={0.3} />
      ))}
    </>
  );
}

function ZodiacDividers({ rotationOffset }: { rotationOffset: number }) {
  const lines = useMemo(() => {
    const result: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < 12; i++) {
      result.push([
        longitudeTo3D(i * 30, ZODIAC_INNER_R, ZODIAC_THICKNESS / 2 + 0.01, rotationOffset),
        longitudeTo3D(i * 30, ZODIAC_OUTER_R, ZODIAC_THICKNESS / 2 + 0.01, rotationOffset),
      ]);
    }
    return result;
  }, [rotationOffset]);

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#8888AA" lineWidth={1.5} transparent opacity={0.65} />
      ))}
    </>
  );
}

function SignSymbols({ rotationOffset }: { rotationOffset: number }) {
  return (
    <>
      {ZODIAC_SIGNS.map((sign, i) => {
        const pos = longitudeTo3D(i * 30 + 15, SIGN_LABEL_R, ZODIAC_THICKNESS / 2 + 0.06, rotationOffset);
        return (
          <Html key={sign.name} position={pos} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
            <span style={{
              color: ELEMENT_TEXT_3D[sign.element] || '#FFFFFF',
              fontSize: 32,
              fontFamily: "'Segoe UI Symbol', 'DejaVu Sans', Arial",
              fontWeight: 700,
              textShadow: `0 0 4px ${ELEMENT_EMISSIVE_3D[sign.element]}44, 0 0 8px #000, 0 0 12px #000`,
              userSelect: 'none',
            }}>
              {sign.symbol}
            </span>
          </Html>
        );
      })}
    </>
  );
}

function DegreeTickMarks({ rotationOffset }: { rotationOffset: number }) {
  const ticks = useMemo(() => {
    const result: { points: [THREE.Vector3, THREE.Vector3]; major: boolean }[] = [];
    const y = ZODIAC_THICKNESS / 2 + 0.01;
    for (let deg = 0; deg < 360; deg += 5) {
      const isMajor = deg % 10 === 0;
      const innerR = isMajor ? ZODIAC_INNER_R - 0.18 : ZODIAC_INNER_R - 0.1;
      result.push({
        points: [longitudeTo3D(deg, innerR, y, rotationOffset), longitudeTo3D(deg, ZODIAC_INNER_R, y, rotationOffset)],
        major: isMajor,
      });
    }
    return result;
  }, [rotationOffset]);

  return (
    <>
      {ticks.map((tick, i) => (
        <Line key={i} points={tick.points} color="#555566" lineWidth={tick.major ? 0.8 : 0.4} transparent opacity={tick.major ? 0.45 : 0.25} />
      ))}
    </>
  );
}

// ─── Decan Ring (36 segments outside zodiac with ruler sign symbols) ─────────

const DECAN_INNER_R = ZODIAC_OUTER_R + 0.05;
const DECAN_OUTER_R = ZODIAC_OUTER_R + 0.9;
const DECAN_LABEL_R = (DECAN_INNER_R + DECAN_OUTER_R) / 2;

// Decan rulers — Chaldean triplicity system
const DECAN_RULERS: Record<string, [string, string, string]> = {
  Aries: ['Aries', 'Leo', 'Sagittarius'],
  Taurus: ['Taurus', 'Virgo', 'Capricorn'],
  Gemini: ['Gemini', 'Libra', 'Aquarius'],
  Cancer: ['Cancer', 'Scorpio', 'Pisces'],
  Leo: ['Leo', 'Sagittarius', 'Aries'],
  Virgo: ['Virgo', 'Capricorn', 'Taurus'],
  Libra: ['Libra', 'Aquarius', 'Gemini'],
  Scorpio: ['Scorpio', 'Pisces', 'Cancer'],
  Sagittarius: ['Sagittarius', 'Aries', 'Leo'],
  Capricorn: ['Capricorn', 'Taurus', 'Virgo'],
  Aquarius: ['Aquarius', 'Gemini', 'Libra'],
  Pisces: ['Pisces', 'Cancer', 'Scorpio'],
};

function DecanRing3D({ rotationOffset }: { rotationOffset: number }) {
  const decans = useMemo(() => {
    const result: { geo: THREE.RingGeometry; element: string; rulerSymbol: string; midPos: THREE.Vector3; isSignBoundary: boolean }[] = [];
    for (let i = 0; i < 36; i++) {
      const signIndex = Math.floor(i / 3);
      const decanNum = i % 3;
      const sign = ZODIAC_SIGNS[signIndex];
      const rulers = DECAN_RULERS[sign.name];
      const rulerSignName = rulers[decanNum];
      const rulerSign = ZODIAC_SIGNS.find(z => z.name === rulerSignName);
      const element = rulerSign?.element || sign.element;

      const startLong = i * 10;
      const thetaStart = longitudeToAngleRad(startLong, rotationOffset);
      const thetaLength = (10 * Math.PI) / 180;
      const geo = new THREE.RingGeometry(DECAN_INNER_R, DECAN_OUTER_R, 16, 1, thetaStart, thetaLength);
      geo.rotateX(-Math.PI / 2);

      const midPos = longitudeTo3D(startLong + 5, DECAN_LABEL_R, ZODIAC_THICKNESS / 2 + 0.07, rotationOffset);

      result.push({ geo, element, rulerSymbol: rulerSign?.symbol || '', midPos, isSignBoundary: decanNum === 0 });
    }
    return result;
  }, [rotationOffset]);

  const dividers = useMemo(() => {
    const lines: { pts: [THREE.Vector3, THREE.Vector3]; major: boolean }[] = [];
    const y = ZODIAC_THICKNESS / 2 + 0.02;
    for (let i = 0; i < 36; i++) {
      lines.push({
        pts: [longitudeTo3D(i * 10, DECAN_INNER_R, y, rotationOffset), longitudeTo3D(i * 10, DECAN_OUTER_R, y, rotationOffset)],
        major: i % 3 === 0,
      });
    }
    return lines;
  }, [rotationOffset]);

  // Outer border circle
  const outerBorder = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const y = ZODIAC_THICKNESS / 2 + 0.02;
    for (let deg = 0; deg <= 360; deg++) pts.push(longitudeTo3D(deg, DECAN_OUTER_R, y, rotationOffset));
    return pts;
  }, [rotationOffset]);

  return (
    <group>
      {/* Colored segments */}
      {decans.map(({ geo, element }, i) => (
        <mesh key={i} geometry={geo} position={[0, ZODIAC_THICKNESS / 2, 0]}>
          <meshStandardMaterial
            color={ELEMENT_BG_3D[element] || '#151515'}
            side={THREE.DoubleSide}
            transparent opacity={0.85}
            emissive={ELEMENT_EMISSIVE_3D[element] || '#444444'}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Ruler sign symbols */}
      {decans.map(({ rulerSymbol, element, midPos }, i) => (
        <Html key={`ds-${i}`} position={midPos} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
          <span style={{
            color: ELEMENT_TEXT_3D[element] || '#fff',
            fontSize: 16,
            fontFamily: "'Segoe UI Symbol', 'DejaVu Sans', Arial",
            fontWeight: 700,
            textShadow: '0 0 3px #000, 0 0 6px #000',
            userSelect: 'none',
            opacity: 0.8,
          }}>
            {rulerSymbol}
          </span>
        </Html>
      ))}

      {/* Divider lines */}
      {dividers.map(({ pts, major }, i) => (
        <Line key={i} points={pts} color="#666677" lineWidth={major ? 1.0 : 0.4} transparent opacity={major ? 0.5 : 0.25} />
      ))}

      {/* Outer border */}
      <Line points={outerBorder} color="#555566" lineWidth={0.8} transparent opacity={0.4} />
    </group>
  );
}

function OuterRingBorder({ rotationOffset }: { rotationOffset: number }) {
  const y = ZODIAC_THICKNESS / 2 + 0.01;
  const outer = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let deg = 0; deg <= 360; deg++) pts.push(longitudeTo3D(deg, ZODIAC_OUTER_R, y, rotationOffset));
    return pts;
  }, [rotationOffset]);
  const inner = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let deg = 0; deg <= 360; deg++) pts.push(longitudeTo3D(deg, ZODIAC_INNER_R, y, rotationOffset));
    return pts;
  }, [rotationOffset]);

  return (
    <>
      <Line points={outer} color="#666677" lineWidth={1.5} transparent opacity={0.65} />
      <Line points={inner} color="#555566" lineWidth={1.2} transparent opacity={0.55} />
    </>
  );
}

// ─── House Cusps ────────────────────────────────────────────────────────────────

function HouseOverlay3D({ houses, rotationOffset }: { houses: Record<string, number>; rotationOffset: number }) {
  const houseEntries = useMemo(() => {
    const entries: { number: number; longitude: number }[] = [];
    for (const [key, long] of Object.entries(houses)) {
      const num = parseInt(key.replace('house_', ''), 10);
      if (!isNaN(num)) entries.push({ number: num, longitude: long });
    }
    return entries.sort((a, b) => a.number - b.number);
  }, [houses]);

  return (
    <>
      {houseEntries.map(({ number, longitude }) => {
        const isAngular = [1, 4, 7, 10].includes(number);
        const inner = longitudeTo3D(longitude, HOUSE_CUSP_INNER, 0.02, rotationOffset);
        const outer = longitudeTo3D(longitude, HOUSE_CUSP_OUTER, 0.02, rotationOffset);

        // House number at midpoint of house sector
        const nextEntry = houseEntries.find((h) => h.number === (number % 12) + 1);
        let midLong: number;
        if (nextEntry) {
          let diff = nextEntry.longitude - longitude;
          if (diff < 0) diff += 360;
          midLong = (longitude + diff / 2) % 360;
        } else {
          midLong = (longitude + 15) % 360;
        }
        const numPos = longitudeTo3D(midLong, HOUSE_NUM_R, 0.06, rotationOffset);

        return (
          <group key={number}>
            {/* House cusp line */}
            <Line
              points={[inner, outer]}
              color={isAngular ? '#BBBBFF' : '#778899'}
              lineWidth={isAngular ? 3.0 : 1.5}
              transparent opacity={isAngular ? 0.95 : 0.6}
            />
            {/* House number — scales with zoom */}
            <Html position={numPos} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
              <span style={{
                color: isAngular ? '#dde' : '#889',
                fontSize: isAngular ? 32 : 22,
                fontFamily: 'Arial, sans-serif',
                fontWeight: isAngular ? 700 : 500,
                textShadow: '0 0 4px #000, 0 0 8px #000',
                userSelect: 'none',
                opacity: isAngular ? 0.8 : 0.5,
              }}>
                {number}
              </span>
            </Html>
            {/* Angle label: AC/IC/DC/MC */}
            {isAngular && (
              <Html
                position={longitudeTo3D(longitude, ZODIAC_INNER_R - 0.4, 0.06, rotationOffset)}
                center distanceFactor={20}
                style={{ pointerEvents: 'none' }}
              >
                <span style={{
                  color: '#bbccee',
                  fontSize: 18,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 700,
                  textShadow: '0 0 4px #000, 0 0 8px #000, 0 0 12px #000',
                  userSelect: 'none',
                  letterSpacing: 2,
                }}>
                  {number === 1 ? 'AC' : number === 4 ? 'IC' : number === 7 ? 'DC' : 'MC'}
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}

function InnerCircle({ rotationOffset }: { rotationOffset: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let deg = 0; deg <= 360; deg += 2) pts.push(longitudeTo3D(deg, HOUSE_CUSP_INNER, 0.01, rotationOffset));
    return pts;
  }, [rotationOffset]);
  return <Line points={points} color="#444466" lineWidth={1.0} transparent opacity={0.5} />;
}

// ─── Planet Markers (the unique 3D part) ────────────────────────────────────────

interface PlanetMarkerData {
  key: string;
  longitude: number;
  displayLongitude: number;
  symbol: string;
  name: string;
  color: string;
  sign?: string;
  house?: number;
  retrograde?: boolean;
}

/**
 * Planet marker — 2 Html labels: compact degree info (inner) + planet symbol (outer).
 * Dramatically reduces overlap vs 4 separate elements.
 * distanceFactor scales with zoom. Hover: 1.1x + glow.
 */
function PlanetMarker3D({
  planet, rotationOffset, selected, dimmed, hovered, tiltFactor, onSelect, onHover,
}: {
  planet: PlanetMarkerData;
  rotationOffset: number;
  selected: boolean;
  dimmed: boolean;
  hovered: boolean;
  tiltFactor: number;
  onSelect: (key: string) => void;
  onHover: (key: string | null) => void;
}) {
  const orbRef = useRef<THREE.Mesh>(null);
  const significance = PLANET_SIGNIFICANCE[planet.key] ?? 0.3;
  const orbSize = 0.08 + significance * 0.12;
  const orbHeight = PLANET_ORB_Y + significance * 0.25;

  // 2 positions: info label (inner) + symbol (outer)
  const infoPos = useMemo(() => longitudeTo3D(planet.displayLongitude, PLANET_INFO_R, 0.05, rotationOffset), [planet.displayLongitude, rotationOffset]);
  const symbolPos = useMemo(() => longitudeTo3D(planet.displayLongitude, PLANET_SYMBOL_R, 0.05, rotationOffset), [planet.displayLongitude, rotationOffset]);
  const orbPos = useMemo(() => longitudeTo3D(planet.displayLongitude, PLANET_SYMBOL_R, orbHeight, rotationOffset), [planet.displayLongitude, rotationOffset, orbHeight]);

  const color = planet.color;
  const signIndex = Math.floor(planet.longitude / 30);
  const signGlyph = ZODIAC_SIGNS[signIndex]?.symbol || '';
  const signElement = ZODIAC_SIGNS[signIndex]?.element || 'air';
  const signColor = ELEMENT_TEXT_3D[signElement] || '#FFEE88';
  const degInSign = Math.floor(planet.longitude % 30);
  const minutes = Math.floor((planet.longitude % 1) * 60);

  const show3D = tiltFactor > 0.15;
  const orbOpacity = Math.min(tiltFactor * 2, 1);

  useFrame(({ clock }) => {
    if (orbRef.current) {
      const t = clock.getElapsedTime();
      const mat = orbRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = dimmed ? 0.05 : selected ? 2.5 + Math.sin(t * 3) * 0.5 : hovered ? 1.8 : 1.0;
      mat.opacity = dimmed ? 0.05 : orbOpacity;
      if (!dimmed) orbRef.current.position.y = orbHeight + Math.sin(t * 1.2 + planet.longitude * 0.05) * 0.04;
    }
  });

  const DF = 20;
  const opacity = dimmed ? 0.15 : 1;
  const ts = '0 0 2px #000, 0 0 5px #000, 0 0 10px #000';
  const scale = selected ? 'scale(1.15)' : hovered ? 'scale(1.1)' : 'scale(1)';
  const hoverIn = () => { onHover(planet.key); document.body.style.cursor = 'pointer'; };
  const hoverOut = () => { onHover(null); document.body.style.cursor = 'auto'; };
  const click = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(planet.key); };

  return (
    <group>
      {/* ── Compact degree info: "14°♈13'" — single inner ring label ── */}
      <Html position={infoPos} center distanceFactor={DF}>
        <span
          onMouseEnter={hoverIn} onMouseLeave={hoverOut} onClick={click}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
            opacity, textShadow: ts,
            transition: 'transform 0.15s ease-out', transform: scale,
          }}
        >
          <span style={{ color: dimmed ? '#333' : '#ddd', fontSize: 15, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
            {degInSign}°
          </span>
          <span style={{ color: dimmed ? '#333' : signColor, fontSize: 14, fontWeight: 700, fontFamily: "'Segoe UI Symbol', Arial" }}>
            {signGlyph}
          </span>
          <span style={{ color: dimmed ? '#333' : '#999', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
            {minutes.toString().padStart(2, '0')}'
          </span>
        </span>
      </Html>

      {/* ── Planet symbol — outer ring, big and bold ── */}
      <Html position={symbolPos} center distanceFactor={DF}>
        <span
          onMouseEnter={hoverIn} onMouseLeave={hoverOut} onClick={click}
          style={{
            color: dimmed ? '#444' : color,
            fontSize: 40,
            fontWeight: 700,
            fontFamily: "'Segoe UI Symbol', 'DejaVu Sans', Arial",
            opacity,
            textShadow: selected
              ? `0 0 6px ${color}, 0 0 14px ${color}, 0 0 28px ${color}55`
              : hovered
                ? `0 0 4px ${color}88, ${ts}`
                : ts,
            cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
            transition: 'transform 0.15s ease-out, text-shadow 0.15s ease-out',
            transform: scale, display: 'inline-block', lineHeight: 1,
          }}
        >
          {planet.symbol}
          {planet.retrograde && <sup style={{ color: '#c41e3a', fontSize: 16, marginLeft: 1 }}>℞</sup>}
        </span>
      </Html>

      {/* ── 3D glow orbs (fade in on tilt) ── */}
      {show3D && !dimmed && (
        <Line points={[symbolPos, orbPos]} color={color} lineWidth={0.4} transparent opacity={(selected ? 0.3 : 0.08) * orbOpacity} />
      )}
      {show3D && !dimmed && (
        <group>
          {/* Inner core — small, bright */}
          <mesh ref={orbRef} position={orbPos}>
            <sphereGeometry args={[orbSize * 0.5, 12, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.8 * orbOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* Outer glow — large, faint */}
          <mesh position={orbPos}>
            <sphereGeometry args={[orbSize * 2, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={(selected ? 0.2 : 0.08) * orbOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── Aspect Lines ───────────────────────────────────────────────────────────────

interface AspectWithDisplay extends SynastryAspect {
  displayLongA: number;
  displayLongB: number;
}

/**
 * Aspect lines are flat and very faint by default (readable from top-down).
 * When highlighted: they arc upward as glowing energy beams with particles.
 */
function AspectLine3DWheel({
  aspect, rotationOffset, highlighted, dimmed, onHover, onClick,
}: {
  aspect: AspectWithDisplay;
  rotationOffset: number;
  highlighted: boolean;
  dimmed: boolean;
  onHover: (asp: SynastryAspect | null) => void;
  onClick: (asp: SynastryAspect) => void;
}) {
  const posA = useMemo(() => longitudeTo3D(aspect.displayLongA, ASPECT_CONNECT_R, ASPECT_Y, rotationOffset), [aspect.displayLongA, rotationOffset]);
  const posB = useMemo(() => longitudeTo3D(aspect.displayLongB, ASPECT_CONNECT_R, ASPECT_Y, rotationOffset), [aspect.displayLongB, rotationOffset]);

  // Arc points (highlighted aspects lift into 3D)
  const arcPoints = useMemo(() => {
    if (!highlighted) return [posA, posB]; // flat line when not highlighted
    // Curved arc that rises above the wheel
    let angleDiff = Math.abs(aspect.displayLongA - aspect.displayLongB);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    const arcHeight = Math.min(angleDiff / 180, 1.0) * 2.0 + 0.3;
    const mid = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
    mid.y = arcHeight;
    const curve = new THREE.QuadraticBezierCurve3(posA, mid, posB);
    return curve.getPoints(40);
  }, [posA, posB, highlighted, aspect.displayLongA, aspect.displayLongB]);

  const color = aspect.aspect.color;
  // Subtle by default, vivid on interaction
  const opacity = dimmed ? 0.0 : highlighted ? 0.85 : 0.05 + aspect.aspect.strength * 0.05;
  const lineWidth = highlighted ? 2.5 : 0.4 + aspect.aspect.strength * 0.3;

  // Hit area
  const tubeGeo = useMemo(() => {
    const curve = new THREE.LineCurve3(posA, posB);
    return new THREE.TubeGeometry(curve, 1, 0.1, 8, false);
  }, [posA, posB]);

  return (
    <group>
      <Line points={arcPoints} color={color} lineWidth={lineWidth} transparent opacity={opacity} />
      {/* Glow overlay for highlighted */}
      {highlighted && (
        <Line points={arcPoints} color="#FFFFFF" lineWidth={lineWidth * 0.3} transparent opacity={0.15} />
      )}
      {/* Hit area */}
      <mesh
        geometry={tubeGeo}
        onClick={(e) => { e.stopPropagation(); onClick(aspect); }}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(aspect); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { onHover(null); document.body.style.cursor = 'auto'; }}
      >
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

// ─── Highlighted Aspect Particles ───────────────────────────────────────────────

function AspectParticles({ aspects, rotationOffset, highlightedIds }: {
  aspects: AspectWithDisplay[];
  rotationOffset: number;
  highlightedIds: Set<string> | null;
}) {
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);

  const activeAspects = useMemo(() => {
    if (!highlightedIds) return [];
    return aspects.filter(asp => {
      const id = `${asp.planetA}-${asp.planetB}-${asp.aspect.type}`;
      return highlightedIds.has(id);
    });
  }, [aspects, highlightedIds]);

  const curves = useMemo(() => {
    return activeAspects.map(asp => {
      const posA = longitudeTo3D(asp.displayLongA, ASPECT_CONNECT_R, ASPECT_Y, rotationOffset);
      const posB = longitudeTo3D(asp.displayLongB, ASPECT_CONNECT_R, ASPECT_Y, rotationOffset);
      let angleDiff = Math.abs(asp.displayLongA - asp.displayLongB);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;
      const arcHeight = Math.min(angleDiff / 180, 1.0) * 2.0 + 0.3;
      const mid = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
      mid.y = arcHeight;
      return new THREE.QuadraticBezierCurve3(posA, mid, posB);
    });
  }, [activeAspects, rotationOffset]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    curves.forEach((curve, i) => {
      const ref = particleRefs.current[i];
      if (!ref) return;
      const speed = 0.25 + (i % 3) * 0.08;
      const progress = (t * speed + i * 0.31) % 1;
      ref.position.copy(curve.getPoint(progress));
    });
  });

  if (activeAspects.length === 0) return null;

  return (
    <>
      {activeAspects.map((asp, i) => (
        <mesh key={`p-${asp.planetA}-${asp.planetB}-${asp.aspect.type}`} ref={el => { particleRefs.current[i] = el; }}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={asp.aspect.color} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Aspect Symbol Badge (floating at midpoint of highlighted arc) ──────────────

function AspectBadges({ aspects, rotationOffset, highlightedIds }: {
  aspects: AspectWithDisplay[];
  rotationOffset: number;
  highlightedIds: Set<string> | null;
}) {
  if (!highlightedIds) return null;

  const activeAspects = aspects.filter(asp => {
    const id = `${asp.planetA}-${asp.planetB}-${asp.aspect.type}`;
    return highlightedIds.has(id);
  });

  return (
    <>
      {activeAspects.map(asp => {
        const posA = longitudeTo3D(asp.displayLongA, ASPECT_CONNECT_R, ASPECT_Y, rotationOffset);
        const posB = longitudeTo3D(asp.displayLongB, ASPECT_CONNECT_R, ASPECT_Y, rotationOffset);
        let angleDiff = Math.abs(asp.displayLongA - asp.displayLongB);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        const arcHeight = Math.min(angleDiff / 180, 1.0) * 2.0 + 0.3;
        const mid = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
        mid.y = arcHeight + 0.3;

        return (
          <Billboard key={`badge-${asp.planetA}-${asp.planetB}-${asp.aspect.type}`} position={mid}>
            <Text fontSize={0.3} color={asp.aspect.color} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
              {asp.aspect.symbol}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

// ─── Cosmic Dust Particles ──────────────────────────────────────────────────────

function CosmicDust() {
  const count = 200;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 8;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = -0.5 + Math.random() * 3;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#6666AA" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ─── Tooltips ───────────────────────────────────────────────────────────────────

function PlanetTooltip3D({ planet }: { planet: PlanetMarkerData }) {
  const signIndex = Math.floor(planet.longitude / 30);
  const degree = Math.floor(planet.longitude % 30);
  const minute = Math.floor((planet.longitude % 1) * 60);
  const signName = ZODIAC_SIGNS[signIndex]?.name || '';
  const signSymbol = ZODIAC_SIGNS[signIndex]?.symbol || '';
  const { degreeSign, degreeSymbol } = calculateDegreeSign(planet.longitude);

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/60 rounded-lg px-3 py-2 text-xs text-white shadow-xl min-w-[160px] pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: planet.color }} className="text-base">{planet.symbol}</span>
        <span className="font-semibold text-sm">{planet.name}</span>
        {planet.retrograde && <span className="text-red-400 text-[10px] font-medium">℞</span>}
      </div>
      <div className="text-gray-300">{degree}°{minute.toString().padStart(2, '0')}' {signSymbol} {signName}</div>
      {planet.house != null && <div className="text-gray-400 mt-0.5">House {planet.house}</div>}
      <div className="text-gray-500 mt-0.5">Degree: {degreeSymbol} {degreeSign}</div>
    </div>
  );
}

function AspectTooltip3D({ aspect }: { aspect: SynastryAspect }) {
  const infoA = getPlanetInfo(aspect.planetA);
  const infoB = getPlanetInfo(aspect.planetB);
  const asp = aspect.aspect;

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/60 rounded-lg px-3 py-2 text-xs text-white shadow-xl min-w-[180px] pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: asp.color }} className="text-base">{asp.symbol}</span>
        <span className="font-semibold text-sm">{asp.name}</span>
      </div>
      <div className="text-gray-300">
        <span style={{ color: infoA.color }}>{infoA.symbol}</span> {infoA.name} → <span style={{ color: infoB.color }}>{infoB.symbol}</span> {infoB.name}
      </div>
      <div className="text-gray-400 mt-0.5">
        Orb: {asp.exactOrb.toFixed(2)}° · <span className={asp.nature === 'harmonious' ? 'text-green-400' : asp.nature === 'challenging' ? 'text-red-400' : 'text-gray-400'}>{asp.nature}</span>
      </div>
      {asp.isApplying !== undefined && <div className="text-gray-500">{asp.isApplying ? 'Applying' : 'Separating'}</div>}
    </div>
  );
}

// ─── Main Scene ─────────────────────────────────────────────────────────────────

export interface Chart3DWheelProps {
  chart: GalacticNatalChart;
  visiblePlanets?: Set<string>;
  visibleAspects?: Set<string>;
  houseSystem?: string;
  showDecans?: boolean;
  selectedPlanet: string | null;
  onSelectPlanet: (key: string | null) => void;
  hoveredPlanet: string | null;
  onHoverPlanet: (key: string | null) => void;
  hoveredAspect: SynastryAspect | null;
  onHoverAspect: (asp: SynastryAspect | null) => void;
  selectedAspect: SynastryAspect | null;
  onSelectAspect: (asp: SynastryAspect | null) => void;
}

export function Chart3DWheel({
  chart, visiblePlanets, visibleAspects, houseSystem = 'whole_sign', showDecans = false,
  selectedPlanet, onSelectPlanet, hoveredPlanet, onHoverPlanet,
  hoveredAspect, onHoverAspect, selectedAspect, onSelectAspect,
}: Chart3DWheelProps) {
  const ascendant = chart.angles?.ascendant ?? 0;
  const rotationOffset = 90 - ascendant;

  // Track camera tilt: 0 = top-down, 1 = fully tilted sideways
  const [tiltFactor, setTiltFactor] = useState(0);
  const { camera } = useThree();
  useFrame(() => {
    // Polar angle: 0 = top-down, PI/2 = horizontal
    const camPos = camera.position;
    const dist = Math.sqrt(camPos.x * camPos.x + camPos.y * camPos.y + camPos.z * camPos.z);
    const polarAngle = Math.acos(Math.max(-1, Math.min(1, camPos.y / dist)));
    // Normalize: 0 at top-down, 1 at horizontal
    const tilt = Math.min(polarAngle / (Math.PI / 2 - 0.05), 1);
    setTiltFactor(tilt);
  });

  const planetData = useMemo<PlanetMarkerData[]>(() => {
    const entries: PlanetMarkerData[] = [];
    for (const [key, data] of Object.entries(chart.planets)) {
      if (data?.longitude === undefined) continue;
      if (visiblePlanets && !visiblePlanets.has(key)) continue;
      const info = getPlanetInfo(key);
      entries.push({ key, longitude: data.longitude, displayLongitude: data.longitude, symbol: info.symbol, name: info.name, color: info.color, sign: data.sign, house: data.house, retrograde: data.retrograde });
    }
    return entries;
  }, [chart.planets, visiblePlanets]);

  const adjustedPlanets = useMemo(() => {
    const placed: PlacedPlanet[] = planetData.map(p => ({ key: p.key, longitude: p.longitude, displayLongitude: p.longitude }));
    const adjusted = adjustForCollisions(placed, 16);
    return planetData.map(p => {
      const adj = adjusted.find(a => a.key === p.key);
      return { ...p, displayLongitude: adj?.displayLongitude ?? p.longitude };
    });
  }, [planetData]);

  const aspects = useMemo<SynastryAspect[]>(() => {
    return calculateNatalAspects(chart.planets, visiblePlanets, visibleAspects ? (new Set(visibleAspects) as Set<AspectType>) : undefined);
  }, [chart.planets, visiblePlanets, visibleAspects]);

  const aspectsWithDisplay = useMemo<AspectWithDisplay[]>(() => {
    return aspects.map(asp => {
      const pA = adjustedPlanets.find(p => p.key === asp.planetA);
      const pB = adjustedPlanets.find(p => p.key === asp.planetB);
      return { ...asp, displayLongA: pA?.displayLongitude ?? asp.longA, displayLongB: pB?.displayLongitude ?? asp.longB };
    });
  }, [aspects, adjustedPlanets]);

  const connectedPlanets = useMemo(() => {
    const focusKey = hoveredPlanet || selectedPlanet;
    if (!focusKey) return null;
    const connected = new Set<string>([focusKey]);
    for (const asp of aspects) {
      if (asp.planetA === focusKey) connected.add(asp.planetB);
      if (asp.planetB === focusKey) connected.add(asp.planetA);
    }
    return connected;
  }, [selectedPlanet, hoveredPlanet, aspects]);

  const highlightedAspectIds = useMemo(() => {
    const focusKey = hoveredPlanet || selectedPlanet;
    if (!focusKey) return null;
    const ids = new Set<string>();
    for (const asp of aspectsWithDisplay) {
      if (asp.planetA === focusKey || asp.planetB === focusKey) ids.add(`${asp.planetA}-${asp.planetB}-${asp.aspect.type}`);
    }
    return ids;
  }, [selectedPlanet, hoveredPlanet, aspectsWithDisplay]);

  const handleSelectPlanet = useCallback((key: string) => {
    onSelectPlanet(selectedPlanet === key ? null : key);
    onSelectAspect(null);
  }, [selectedPlanet, onSelectPlanet, onSelectAspect]);

  const handleSelectAspect = useCallback((asp: SynastryAspect) => {
    const isSame = selectedAspect && selectedAspect.planetA === asp.planetA && selectedAspect.planetB === asp.planetB && selectedAspect.aspect.type === asp.aspect.type;
    onSelectAspect(isSame ? null : asp);
  }, [selectedAspect, onSelectAspect]);

  const handleBackgroundClick = useCallback(() => { onSelectPlanet(null); onSelectAspect(null); }, [onSelectPlanet, onSelectAspect]);

  // Calculate house cusps client-side (same as 2D chart)
  const houseCusps = useMemo<Record<string, number>>(() => {
    const asc = chart.angles?.ascendant;
    const mc = chart.angles?.midheaven ?? 0;
    if (asc === undefined) return chart.houses || {};
    const cusps = calculateHouseCusps(asc, mc, 0, houseSystem);
    const result: Record<string, number> = {};
    cusps.forEach((cusp, i) => { result[`house_${i + 1}`] = cusp; });
    return result;
  }, [chart.angles, houseSystem, chart.houses]);

  return (
    <>
      {/* Camera — starts top-down, no auto-rotate */}
      <OrbitControls makeDefault enablePan={false} minDistance={8} maxDistance={28} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} target={[0, 0, 0]} enableDamping dampingFactor={0.08} />

      {/* Lighting */}
      <ambientLight intensity={0.9} color="#BBCCEE" />
      <directionalLight position={[0, 20, 0]} intensity={0.5} color="#FFFFFF" />
      <directionalLight position={[5, 10, 5]} intensity={0.15} color="#AABBFF" />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#6666CC" distance={15} decay={2} />

      {/* Background */}
      <StarField3D />
      <CosmicDust />
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 50, 150]} />
      <mesh><sphereGeometry args={[120, 32, 32]} /><meshBasicMaterial color="#030308" side={THREE.BackSide} /></mesh>

      {/* Background click plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} onClick={handleBackgroundClick}>
        <planeGeometry args={[60, 60]} /><meshBasicMaterial visible={false} />
      </mesh>

      {/* Inner disc — subtle gradient center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[ZODIAC_INNER_R, 64]} />
        <meshStandardMaterial color="#0a0a1e" emissive="#111133" emissiveIntensity={0.08} transparent opacity={0.97} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer glow ring — subtle halo around chart */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <ringGeometry args={[ZODIAC_OUTER_R + 0.02, ZODIAC_OUTER_R + 1.5, 64]} />
        <meshBasicMaterial color="#334466" transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Zodiac Ring (3D with thickness) */}
      {ZODIAC_SIGNS.map((sign, i) => <ZodiacSegment key={sign.name} index={i} element={sign.element} rotationOffset={rotationOffset} />)}
      <ZodiacEdge rotationOffset={rotationOffset} />
      <ZodiacDividers rotationOffset={rotationOffset} />
      <OuterRingBorder rotationOffset={rotationOffset} />
      <SignSymbols rotationOffset={rotationOffset} />
      <DegreeTickMarks rotationOffset={rotationOffset} />
      <InnerCircle rotationOffset={rotationOffset} />

      {/* Decan Ring */}
      {showDecans && <DecanRing3D rotationOffset={rotationOffset} />}

      {/* House Cusps */}
      {Object.keys(houseCusps).length > 0 && <HouseOverlay3D houses={houseCusps} rotationOffset={rotationOffset} />}

      {/* Aspect Lines */}
      {aspectsWithDisplay.map(asp => {
        const aspId = `${asp.planetA}-${asp.planetB}-${asp.aspect.type}`;
        const isHighlighted = highlightedAspectIds ? highlightedAspectIds.has(aspId) : false;
        const isDimmed = highlightedAspectIds !== null && !isHighlighted;
        const isHovered = hoveredAspect && hoveredAspect.planetA === asp.planetA && hoveredAspect.planetB === asp.planetB && hoveredAspect.aspect.type === asp.aspect.type;
        return <AspectLine3DWheel key={aspId} aspect={asp} rotationOffset={rotationOffset} highlighted={isHighlighted || !!isHovered} dimmed={isDimmed} onHover={onHoverAspect} onClick={handleSelectAspect} />;
      })}

      {/* Flowing particles on highlighted aspects */}
      <AspectParticles aspects={aspectsWithDisplay} rotationOffset={rotationOffset} highlightedIds={highlightedAspectIds} />

      {/* Aspect symbol badges floating at arc midpoints */}
      <AspectBadges aspects={aspectsWithDisplay} rotationOffset={rotationOffset} highlightedIds={highlightedAspectIds} />

      {/* Planet Markers */}
      {adjustedPlanets.map(planet => (
        <PlanetMarker3D
          key={planet.key}
          planet={planet}
          rotationOffset={rotationOffset}
          selected={selectedPlanet === planet.key}
          hovered={hoveredPlanet === planet.key}
          dimmed={connectedPlanets !== null && !connectedPlanets.has(planet.key)}
          tiltFactor={tiltFactor}
          onSelect={handleSelectPlanet}
          onHover={onHoverPlanet}
        />
      ))}

      {/* Tooltips */}
      {hoveredPlanet && (() => {
        const p = adjustedPlanets.find(pl => pl.key === hoveredPlanet);
        if (!p) return null;
        const pos = longitudeTo3D(p.displayLongitude, PLANET_SYMBOL_R, PLANET_ORB_Y + 1.2, rotationOffset);
        return <Html position={pos} center style={{ pointerEvents: 'none' }}><PlanetTooltip3D planet={p} /></Html>;
      })()}

      {hoveredAspect && (() => {
        const pA = adjustedPlanets.find(p => p.key === hoveredAspect.planetA);
        const pB = adjustedPlanets.find(p => p.key === hoveredAspect.planetB);
        if (!pA || !pB) return null;
        const posA = longitudeTo3D(pA.displayLongitude, ASPECT_CONNECT_R, 0, rotationOffset);
        const posB = longitudeTo3D(pB.displayLongitude, ASPECT_CONNECT_R, 0, rotationOffset);
        const midPos = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
        midPos.y = 1.5;
        return <Html position={midPos} center style={{ pointerEvents: 'none' }}><AspectTooltip3D aspect={hoveredAspect} /></Html>;
      })()}
    </>
  );
}
