/**
 * PlanetNode3D
 * Realistic procedural planet textures, enhanced orb glows,
 * optional rings (Saturn/Uranus/Chiron), name label ABOVE the planet,
 * degree display, hover tooltip.
 */

import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Planet3D } from './types';
import { PLANET_COLORS_3D } from './constants';
import { calculateSpark } from '../biwheel/utils/chartMath';

// ─── Texture caches (shared across instances) ────────────────────────────────

const planetTextureCache = new Map<string, THREE.CanvasTexture>();
const glowTextureCache = new Map<string, THREE.CanvasTexture>();
const auraTextureCache = new Map<string, THREE.CanvasTexture>();

// ─── Procedural planet surface textures ──────────────────────────────────────

/** Simple seeded pseudo-random for deterministic textures */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Create a realistic-looking equirectangular surface texture for a planet */
function makePlanetTexture(key: string): THREE.CanvasTexture {
  if (planetTextureCache.has(key)) return planetTextureCache.get(key)!;

  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const baseColor = PLANET_COLORS_3D[key] ?? '#A0A0A0';
  const base = new THREE.Color(baseColor);
  const rand = seededRandom(key.split('').reduce((a, c) => a + c.charCodeAt(0), 0));

  switch (key) {
    case 'sun': {
      // Bright golden-white with subtle granulation
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grad.addColorStop(0, '#FFFEF0');
      grad.addColorStop(0.4, '#FFE880');
      grad.addColorStop(0.8, '#FFD040');
      grad.addColorStop(1, '#FFC020');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Granulation noise
      for (let i = 0; i < 2000; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const brightness = 180 + rand() * 75;
        ctx.fillStyle = `rgba(${brightness},${brightness},${Math.round(brightness * 0.7)},0.15)`;
        ctx.fillRect(x, y, 2, 2);
      }
      break;
    }

    case 'moon': {
      // Gray surface with craters
      ctx.fillStyle = '#B8B8B0';
      ctx.fillRect(0, 0, w, h);
      // Maria (darker regions)
      for (let i = 0; i < 8; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 10 + rand() * 25;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,100,95,${0.2 + rand() * 0.15})`;
        ctx.fill();
      }
      // Craters
      for (let i = 0; i < 30; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 2 + rand() * 8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90,90,85,${0.15 + rand() * 0.15})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,200,195,${0.08 + rand() * 0.08})`;
        ctx.fill();
      }
      break;
    }

    case 'mercury': {
      // Dark rocky gray with craters
      ctx.fillStyle = '#909090';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 50; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 1 + rand() * 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(70,70,70,${0.2 + rand() * 0.2})`;
        ctx.fill();
      }
      break;
    }

    case 'venus': {
      // Pale yellowish with cloud swirls
      ctx.fillStyle = '#E0D090';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) {
        const wave = Math.sin(y * 0.08 + rand() * 6) * 15;
        ctx.fillStyle = `rgba(230,220,170,${0.15 + rand() * 0.1})`;
        ctx.fillRect(wave, y, w, 3);
      }
      break;
    }

    case 'mars': {
      // Rusty red-orange with darker features
      ctx.fillStyle = '#C04010';
      ctx.fillRect(0, 0, w, h);
      // Darker regions
      for (let i = 0; i < 12; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 8 + rand() * 20;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,30,10,${0.15 + rand() * 0.15})`;
        ctx.fill();
      }
      // Polar caps
      ctx.fillStyle = 'rgba(220,200,180,0.3)';
      ctx.fillRect(0, 0, w, 8);
      ctx.fillRect(0, h - 8, w, 8);
      break;
    }

    case 'jupiter': {
      // Banded — cream, tan, orange, brown bands
      const bands = [
        '#E0D0B0', '#D0A060', '#C8A050', '#E8D8B0', '#B07030',
        '#E0C880', '#C09040', '#E8D0A0', '#D0A868', '#E0D0B0',
        '#B08040', '#D8C090', '#C0A060', '#E0D0B0', '#B07838',
      ];
      const bandH = h / bands.length;
      bands.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, i * bandH, w, bandH + 1);
      });
      // Great Red Spot
      ctx.beginPath();
      ctx.ellipse(w * 0.65, h * 0.6, 12, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,80,40,0.4)';
      ctx.fill();
      // Band edge turbulence
      for (let i = 0; i < 300; i++) {
        const x = rand() * w;
        const y = rand() * h;
        ctx.fillStyle = `rgba(${160 + rand() * 60},${120 + rand() * 50},${60 + rand() * 40},0.12)`;
        ctx.fillRect(x, y, 3, 1);
      }
      break;
    }

    case 'saturn': {
      // Golden-beige with subtle horizontal bands
      const bands = [
        '#E8D898', '#D8C880', '#E0D090', '#D0C078', '#E8D8A0',
        '#D4C488', '#E0D098', '#C8B870', '#E8D8A0', '#D8C888',
      ];
      const bandH = h / bands.length;
      bands.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, i * bandH, w, bandH + 1);
      });
      // Subtle noise
      for (let i = 0; i < 200; i++) {
        const x = rand() * w;
        const y = rand() * h;
        ctx.fillStyle = `rgba(200,180,120,0.08)`;
        ctx.fillRect(x, y, 2, 1);
      }
      break;
    }

    case 'uranus': {
      // Pale cyan-teal, nearly uniform
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#90E0E0');
      grad.addColorStop(0.3, '#80D8D8');
      grad.addColorStop(0.7, '#78D0D0');
      grad.addColorStop(1, '#88D8D8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'neptune': {
      // Deep blue with streaks
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#2848B0');
      grad.addColorStop(0.4, '#3060D0');
      grad.addColorStop(0.6, '#2850C0');
      grad.addColorStop(1, '#2040A0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Cloud streaks
      for (let i = 0; i < 6; i++) {
        const y = h * 0.2 + rand() * h * 0.6;
        ctx.fillStyle = `rgba(80,120,220,${0.2 + rand() * 0.15})`;
        ctx.fillRect(rand() * w * 0.3, y, w * 0.4 + rand() * w * 0.3, 2);
      }
      break;
    }

    case 'pluto': {
      // Tan-brown with heart-shaped lighter region
      ctx.fillStyle = '#B8A078';
      ctx.fillRect(0, 0, w, h);
      // Lighter region (Tombaugh Regio)
      ctx.beginPath();
      ctx.ellipse(w * 0.4, h * 0.45, 20, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,195,165,0.35)';
      ctx.fill();
      for (let i = 0; i < 20; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 2 + rand() * 5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90,75,55,${0.1 + rand() * 0.1})`;
        ctx.fill();
      }
      break;
    }

    // ── S-type (Stony) asteroids: silicate-rich, moderate albedo, craters ──
    case 'astraea': case 'hebe': case 'iris': case 'flora': case 'metis':
    case 'eunomia': case 'eros': case 'fama': case 'toro': case 'ganymed':
    case 'apophis': case 'icarus': case 'nemesis': case 'sophia': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);
      // Silicate mineral patches
      for (let i = 0; i < 15; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 4 + rand() * 12;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + 20)},${Math.min(255, g + 15)},${b},${0.08 + rand() * 0.1})`;
        ctx.fill();
      }
      // Impact craters
      for (let i = 0; i < 25; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 1 + rand() * 5;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(r * 0.65)},${Math.round(g * 0.65)},${Math.round(b * 0.65)},${0.12 + rand() * 0.12})`;
        ctx.fill();
        // Bright rim
        ctx.beginPath();
        ctx.arc(px + 0.5, py - 0.5, pr * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 25)},${Math.min(255, b + 20)},0.06)`;
        ctx.fill();
      }
      // Surface roughness
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(${r},${g},${b},${0.03 + rand() * 0.04})`;
        ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1);
      }
      break;
    }

    // ── C-type (Carbonaceous) asteroids: very dark, primitive, low albedo ──
    case 'euphrosyne': case 'europa': case 'cybele': case 'thisbe':
    case 'minerva': case 'elektra': case 'bamberga': case 'davida':
    case 'interamnia': case 'hygeia': case 'lilithast': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      // Very dark base
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);
      // Carbon-rich dark patches
      for (let i = 0; i < 20; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 5 + rand() * 15;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b * 0.7)},${0.1 + rand() * 0.12})`;
        ctx.fill();
      }
      // Subtle lighter veins (hydrated mineral deposits)
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(rand() * w, rand() * h);
        ctx.lineTo(rand() * w, rand() * h);
        ctx.lineWidth = 0.5 + rand();
        ctx.strokeStyle = `rgba(${Math.min(255, r + 40)},${Math.min(255, g + 35)},${Math.min(255, b + 30)},0.06)`;
        ctx.stroke();
      }
      // Fine grain texture
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = `rgba(${Math.round(r * 0.85)},${Math.round(g * 0.85)},${Math.round(b * 0.85)},0.04)`;
        ctx.fillRect(rand() * w, rand() * h, 1, 1);
      }
      break;
    }

    // ── M-type (Metallic) asteroids: iron-nickel, metallic sheen ──
    case 'psyche': case 'kleopatra': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      // Metallic base with gradient
      const metalGrad = ctx.createLinearGradient(0, 0, w, h);
      metalGrad.addColorStop(0, `rgb(${Math.min(255, r + 15)},${Math.min(255, g + 10)},${b})`);
      metalGrad.addColorStop(0.3, `rgb(${r},${g},${b})`);
      metalGrad.addColorStop(0.6, `rgb(${Math.min(255, r + 25)},${Math.min(255, g + 20)},${Math.min(255, b + 10)})`);
      metalGrad.addColorStop(1, `rgb(${Math.round(r * 0.9)},${Math.round(g * 0.9)},${Math.round(b * 0.9)})`);
      ctx.fillStyle = metalGrad;
      ctx.fillRect(0, 0, w, h);
      // Metallic specular highlights
      for (let i = 0; i < 12; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 3 + rand() * 10;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,240,${0.04 + rand() * 0.06})`;
        ctx.fill();
      }
      // Iron crystal patterns
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        const sx = rand() * w;
        const sy = rand() * h;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (rand() - 0.5) * 30, sy + (rand() - 0.5) * 15);
        ctx.lineWidth = 0.5 + rand() * 0.5;
        ctx.strokeStyle = `rgba(${Math.min(255, r + 40)},${Math.min(255, g + 35)},${Math.min(255, b + 20)},0.08)`;
        ctx.stroke();
      }
      // Surface pitting
      for (let i = 0; i < 20; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 1 + rand() * 3;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b * 0.7)},0.12)`;
        ctx.fill();
      }
      break;
    }

    // ── Rubble-pile asteroids: visible fragment structure ──
    case 'sylvia': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);
      // Fragment boundaries (rubble pile structure)
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        const sx = rand() * w;
        const sy = rand() * h;
        ctx.moveTo(sx, sy);
        for (let j = 0; j < 4; j++) {
          ctx.lineTo(sx + (rand() - 0.5) * 40, sy + (rand() - 0.5) * 20);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${Math.round(r * (0.8 + rand() * 0.3))},${Math.round(g * (0.8 + rand() * 0.3))},${Math.round(b * (0.8 + rand() * 0.3))},${0.1 + rand() * 0.08})`;
        ctx.fill();
      }
      break;
    }

    // ── Centaurs: mixed ice/rock, reddish organic surfaces ──
    case 'pholus': case 'nessus': case 'nyx': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);
      // Reddish tholin patches (organic ice deposits)
      for (let i = 0; i < 10; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 6 + rand() * 18;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + 30)},${Math.round(g * 0.8)},${Math.round(b * 0.7)},${0.08 + rand() * 0.1})`;
        ctx.fill();
      }
      // Bright ice patches
      for (let i = 0; i < 6; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 2 + rand() * 6;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,210,220,${0.05 + rand() * 0.06})`;
        ctx.fill();
      }
      break;
    }

    // ── Red TNOs: tholin-coated icy surfaces ──
    case 'sedna': case 'makemake': case 'quaoar': case 'varuna':
    case 'gonggong': case 'varda': case 'ixion': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      // Red-tinted icy surface
      const tnoGrad = ctx.createLinearGradient(0, 0, 0, h);
      tnoGrad.addColorStop(0, `rgb(${Math.min(255, r + 10)},${g},${b})`);
      tnoGrad.addColorStop(0.5, `rgb(${r},${g},${b})`);
      tnoGrad.addColorStop(1, `rgb(${Math.round(r * 0.9)},${Math.round(g * 0.9)},${Math.round(b * 0.9)})`);
      ctx.fillStyle = tnoGrad;
      ctx.fillRect(0, 0, w, h);
      // Tholin deposits (dark organic compounds)
      for (let i = 0; i < 12; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 5 + rand() * 15;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + 20)},${Math.round(g * 0.75)},${Math.round(b * 0.6)},${0.06 + rand() * 0.08})`;
        ctx.fill();
      }
      // Ice frost patches
      for (let i = 0; i < 5; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 3 + rand() * 8;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,225,230,${0.04 + rand() * 0.04})`;
        ctx.fill();
      }
      break;
    }

    // ── Bright TNOs: high-albedo icy surfaces ──
    case 'eris': case 'haumea': case 'orcus': case 'salacia': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      // Bright icy base
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);
      // Nitrogen/methane frost regions (bright patches)
      for (let i = 0; i < 10; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 8 + rand() * 18;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.04 + rand() * 0.06})`;
        ctx.fill();
      }
      // Subtle darker terrain
      for (let i = 0; i < 8; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 4 + rand() * 10;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(r * 0.8)},${Math.round(g * 0.8)},${Math.round(b * 0.85)},${0.06 + rand() * 0.06})`;
        ctx.fill();
      }
      // Ice crystal sparkle
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.03 + rand() * 0.04})`;
        ctx.fillRect(rand() * w, rand() * h, 1, 1);
      }
      break;
    }

    // ── Mathematical points: ethereal gradient glow ──
    case 'truelilith': case 'meanlilith': case 'whitemoon':
    case 'vertex':
    case 'lot_fortune': case 'lot_spirit': case 'lot_eros': case 'lot_marriage':
    case 'lot_wealth': case 'lot_victory': case 'lot_commerce': case 'lot_passion':
    case 'lot_mother': case 'lot_father': case 'lot_children': case 'lot_travel': {
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      // Ethereal radial gradient — these aren't physical bodies
      const ethGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      ethGrad.addColorStop(0, `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},1)`);
      ethGrad.addColorStop(0.3, `rgba(${r},${g},${b},0.9)`);
      ethGrad.addColorStop(0.7, `rgba(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b * 0.7)},0.6)`);
      ethGrad.addColorStop(1, `rgba(${Math.round(r * 0.4)},${Math.round(g * 0.4)},${Math.round(b * 0.4)},0.3)`);
      ctx.fillStyle = ethGrad;
      ctx.fillRect(0, 0, w, h);
      // Sparkle/shimmer overlay
      for (let i = 0; i < 60; i++) {
        const px = rand() * w;
        const py = rand() * h;
        ctx.fillStyle = `rgba(255,255,255,${0.02 + rand() * 0.05})`;
        ctx.fillRect(px, py, 1, 1);
      }
      break;
    }

    default: {
      // Generic rocky/icy body
      const r = Math.round(base.r * 255);
      const g = Math.round(base.g * 255);
      const b = Math.round(base.b * 255);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) {
        const px = rand() * w;
        const py = rand() * h;
        const pr = 2 + rand() * 5;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r * 0.7},${g * 0.7},${b * 0.7},0.15)`;
        ctx.fill();
      }
      break;
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  planetTextureCache.set(key, tex);
  return tex;
}

// ─── Ring textures (Saturn, Uranus, Chiron) ──────────────────────────────────

const ringTextureCache = new Map<string, THREE.CanvasTexture>();

/** Procedural ring texture with bands and gaps like real planetary rings */
function makeRingTexture(key: string): THREE.CanvasTexture {
  if (ringTextureCache.has(key)) return ringTextureCache.get(key)!;

  const w = 512;
  const h = 1; // 1D texture stretched across ring radius
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (key === 'saturn') {
    // Saturn: multiple concentric bands with Cassini Division gap
    const bands: [number, number, number, number][] = [
      // [startFrac, endFrac, r/g/b brightness 0-255, alpha 0-1]
      // D ring (faint inner)
      [0, 0.06, 160, 0.15],
      // C ring (semi-transparent)
      [0.06, 0.20, 180, 0.3],
      [0.20, 0.22, 140, 0.15], // gap
      // B ring (brightest, widest)
      [0.22, 0.48, 210, 0.7],
      [0.35, 0.38, 195, 0.5], // subtle mid-band
      // Cassini Division (dark gap)
      [0.48, 0.54, 80, 0.1],
      // A ring
      [0.54, 0.78, 200, 0.55],
      // Encke Gap
      [0.66, 0.68, 100, 0.1],
      // A ring continues
      [0.68, 0.78, 190, 0.5],
      // F ring (thin outer)
      [0.82, 0.86, 170, 0.35],
      // Outer fade
      [0.86, 1.0, 140, 0.08],
    ];

    // Base: very faint
    ctx.fillStyle = 'rgba(180,160,120,0.05)';
    ctx.fillRect(0, 0, w, h);

    for (const [s, e, brightness, alpha] of bands) {
      const x = Math.round(s * w);
      const width = Math.round((e - s) * w);
      ctx.fillStyle = `rgba(${brightness},${Math.round(brightness * 0.85)},${Math.round(brightness * 0.6)},${alpha})`;
      ctx.fillRect(x, 0, width, h);
    }
  } else if (key === 'uranus') {
    // Uranus: thin faint rings
    ctx.fillStyle = 'rgba(100,180,180,0.05)';
    ctx.fillRect(0, 0, w, h);
    const ringPositions = [0.15, 0.25, 0.35, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9];
    for (const pos of ringPositions) {
      const x = Math.round(pos * w);
      ctx.fillStyle = 'rgba(130,210,210,0.3)';
      ctx.fillRect(x, 0, 2, h);
    }
  } else {
    // Chiron / default: subtle single band
    ctx.fillStyle = 'rgba(140,110,100,0.2)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(160,130,110,0.35)';
    ctx.fillRect(Math.round(w * 0.2), 0, Math.round(w * 0.6), h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  ringTextureCache.set(key, tex);
  return tex;
}

// ─── Glow / Aura textures ────────────────────────────────────────────────────

function makeGlowTexture(color: THREE.Color): THREE.CanvasTexture {
  const key = `#${color.getHexString()}`;
  if (glowTextureCache.has(key)) return glowTextureCache.get(key)!;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gradient.addColorStop(0.15, `rgba(${r},${g},${b},0.6)`);
  gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.2)`);
  gradient.addColorStop(0.7, `rgba(${r},${g},${b},0.05)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  glowTextureCache.set(key, tex);
  return tex;
}

function makeAuraTexture(color: THREE.Color): THREE.CanvasTexture {
  const key = `#${color.getHexString()}`;
  if (auraTextureCache.has(key)) return auraTextureCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  gradient.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
  gradient.addColorStop(0.15, `rgba(${r},${g},${b},0.10)`);
  gradient.addColorStop(0.35, `rgba(${r},${g},${b},0.04)`);
  gradient.addColorStop(0.6, `rgba(${r},${g},${b},0.01)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  auraTextureCache.set(key, tex);
  return tex;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PlanetNode3DProps {
  planet: Planet3D;
  selected: boolean;
  onSelect: (key: string) => void;
  animationDelay?: number;
  dimmed?: boolean;
}

export function PlanetNode3D({ planet, selected, onSelect, animationDelay = 0, dimmed = false }: PlanetNode3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(animationDelay === 0);
  const scaleRef = useRef(animationDelay === 0 ? 1 : 0);
  const startTimeRef = useRef<number | null>(null);

  // Use realistic 3D color, falling back to chart color
  const realColor = PLANET_COLORS_3D[planet.key] ?? planet.color;
  const planetColor3D = useMemo(() => new THREE.Color(realColor), [realColor]);

  const surfaceTexture = useMemo(() => makePlanetTexture(planet.key), [planet.key]);
  const ringTexture = useMemo(
    () => planet.hasRing ? makeRingTexture(planet.key) : null,
    [planet.key, planet.hasRing],
  );

  // Ring geometry with radial UVs so banded texture maps concentrically
  const ringGeo = useMemo(() => {
    if (!planet.hasRing || !planet.ringSize) return null;
    const innerR = planet.size * 1.5;
    const outerR = planet.size * planet.ringSize;
    const geo = new THREE.RingGeometry(innerR, outerR, 64);
    // Remap UVs: u = normalized radial distance (inner→outer), v = 0.5
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const t = (dist - innerR) / (outerR - innerR);
      uv.setXY(i, t, 0.5);
    }
    uv.needsUpdate = true;
    return geo;
  }, [planet.hasRing, planet.ringSize, planet.size]);

  const glowTexture = useMemo(
    () => makeGlowTexture(planetColor3D),
    [planetColor3D],
  );

  const auraTexture = useMemo(
    () => makeAuraTexture(planetColor3D),
    [planetColor3D],
  );

  // Orb glow size — larger like landing page, still capped
  const auraSize = Math.min(planet.size * 5, planet.orb * 0.2 + planet.size * 2.5);

  // Degree + sign + spark label text
  const { degreeText, sparkSymbol } = useMemo(() => {
    const signDeg = Math.floor(planet.longitude % 30);
    const signs = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
    const signIndex = Math.floor(planet.longitude / 30);
    const spark = calculateSpark(planet.longitude);
    return {
      degreeText: `${signDeg}° ${signs[signIndex] ?? ''}`,
      sparkSymbol: spark.sparkSymbol,
    };
  }, [planet.longitude]);

  const onPointerOver = useCallback((e: THREE.Event) => {
    (e as any).stopPropagation?.();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const onPointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = '';
  }, []);

  const onClick = useCallback((e: THREE.Event) => {
    (e as any).stopPropagation?.();
    onSelect(planet.key);
  }, [onSelect, planet.key]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Entrance animation
    if (!visible) {
      if (startTimeRef.current === null) startTimeRef.current = t;
      const elapsed = (t - startTimeRef.current) * 1000;
      if (elapsed >= animationDelay) {
        setVisible(true);
      }
    }

    // Scale animation
    const targetScale = visible ? 1 : 0;
    scaleRef.current += (targetScale - scaleRef.current) * 0.1;

    if (groupRef.current) {
      const s = scaleRef.current;
      groupRef.current.scale.set(s, s, s);
    }

    // Emissive pulse
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const isSun = planet.key === 'sun';
      const baseIntensity = isSun ? 1.0 : (hovered || selected ? 0.8 : 0.5);
      mat.emissiveIntensity = baseIntensity + Math.sin(t * 2.5) * 0.15;
    }

    // Aura breathing
    if (auraRef.current) {
      const breathe = 1 + Math.sin(t * 1.2) * 0.08;
      const s = auraSize * breathe;
      auraRef.current.scale.set(s, s, 1);
    }
  });

  // Glow size — bigger like landing page
  const glowSize = planet.size * 6;
  const isActive = hovered || selected;
  const dimFactor = dimmed ? 0.3 : 1;

  const isAsteroid = planet.category === 'asteroid';
  const isPoint = planet.category === 'point';
  const isSmall = isAsteroid || isPoint;
  const labelY = planet.size + (isSmall ? 0.6 : 1.2);

  return (
    <group ref={groupRef} position={planet.position}>
      {/* Hit area */}
      <mesh
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[planet.size * 1.5, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Planet body — textured sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[planet.size, 32, 32]} />
        <meshStandardMaterial
          map={surfaceTexture}
          emissive={realColor}
          emissiveIntensity={planet.key === 'sun' ? 0.8 : 0.5}
          roughness={planet.key === 'sun' ? 0.15 : 0.45}
          metalness={0.05}
        />
      </mesh>

      {/* Planet rings (Saturn, Uranus, Chiron) — flat disc with banded texture */}
      {planet.hasRing && planet.ringColor && planet.ringTilt != null && planet.ringSize && ringGeo && (
        <mesh rotation={[planet.ringTilt, 0, 0]} geometry={ringGeo}>
          <meshBasicMaterial
            map={ringTexture}
            color={planet.ringColor}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Planet glow — larger halo like landing page */}
      <sprite scale={[glowSize, glowSize, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={(isActive ? 0.7 : 0.5) * dimFactor}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Orb aura — always on, energy field */}
      {auraSize > 0 && (
        <sprite ref={auraRef} scale={[auraSize, auraSize, 1]}>
          <spriteMaterial
            map={auraTexture}
            transparent
            opacity={(isActive ? 0.55 : 0.35) * dimFactor}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[planet.size * 1.8, 0.03, 8, 48]} />
          <meshBasicMaterial
            color={realColor}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Point light on larger planets */}
      {planet.size >= 0.3 && (
        <pointLight
          color={planetColor3D}
          intensity={isActive ? 0.45 : 0.2}
          distance={planet.size * 8}
          decay={2}
        />
      )}

      {/* Planet name + symbol label — hidden when hovered (tooltip replaces it) */}
      {/* Points always show (like planets), asteroids only when selected */}
      {!hovered && (isAsteroid ? selected : true) && (
        <Billboard position={[0, labelY, 0]}>
          <Text
            fontSize={isPoint ? 0.28 : isAsteroid ? 0.22 : 0.3}
            color={realColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.025}
            outlineColor="#000000"
            fillOpacity={(isActive ? 1 : 0.85) * dimFactor}
          >
            {planet.symbol} {planet.name}{planet.retrograde ? ' ℞' : ''}
          </Text>
        </Billboard>
      )}

      {/* Degree label — hidden when hovered (tooltip replaces it) */}
      {!hovered && (isAsteroid ? selected : true) && (
        <Billboard position={[0, labelY - (isSmall ? 0.3 : 0.4), 0]}>
          <Text
            fontSize={isSmall ? 0.18 : 0.22}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            fillOpacity={(isActive ? 0.9 : 0.6) * dimFactor}
          >
            {degreeText} {sparkSymbol}{planet.retrograde ? ' ℞' : ''}
          </Text>
        </Billboard>
      )}

      {/* Hover tooltip — replaces labels on hover, positioned above planet */}
      {hovered && (
        <Html
          center
          position={[0, labelY, 0]}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          zIndexRange={[50, 0]}
        >
          <div style={{
            background: 'rgba(10, 8, 20, 0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${realColor}40`,
            borderRadius: 10,
            padding: '8px 12px',
            maxWidth: 200,
            whiteSpace: 'normal',
            boxShadow: `0 0 20px ${realColor}20, 0 4px 12px rgba(0,0,0,0.4)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 16, color: realColor }}>{planet.symbol}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>
                {planet.name}
                {planet.retrograde && ' ℞'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
              {Math.floor(planet.longitude % 30)}° {planet.sign}
              {planet.house ? ` · House ${planet.house}` : ''}
              <br />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                {planet.category} · orb {planet.orb}°
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
