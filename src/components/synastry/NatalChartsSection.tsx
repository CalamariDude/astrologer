/**
 * NatalChartsSection - Displays natal chart positions for both people
 * Light theme version with educational explanations
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Calendar, MapPin, Clock } from 'lucide-react';
import { PersonData, NatalChartData, PLANET_ORDER } from './types';
import { PLANETS } from '@/data/astrologyEducation';

interface NatalChartsSectionProps {
  personA: PersonData;
  personB: PersonData;
  expertMode: boolean;
  className?: string;
}

// Zodiac sign data for display
const ZODIAC_SIGNS: Record<string, { symbol: string; element: string; modality: string; color: string }> = {
  'Aries': { symbol: '♈', element: 'Fire', modality: 'Cardinal', color: '#ef4444' },
  'Taurus': { symbol: '♉', element: 'Earth', modality: 'Fixed', color: '#22c55e' },
  'Gemini': { symbol: '♊', element: 'Air', modality: 'Mutable', color: '#eab308' },
  'Cancer': { symbol: '♋', element: 'Water', modality: 'Cardinal', color: '#3b82f6' },
  'Leo': { symbol: '♌', element: 'Fire', modality: 'Fixed', color: '#f97316' },
  'Virgo': { symbol: '♍', element: 'Earth', modality: 'Mutable', color: '#84cc16' },
  'Libra': { symbol: '♎', element: 'Air', modality: 'Cardinal', color: '#ec4899' },
  'Scorpio': { symbol: '♏', element: 'Water', modality: 'Fixed', color: '#7c3aed' },
  'Sagittarius': { symbol: '♐', element: 'Fire', modality: 'Mutable', color: '#8b5cf6' },
  'Capricorn': { symbol: '♑', element: 'Earth', modality: 'Cardinal', color: '#78716c' },
  'Aquarius': { symbol: '♒', element: 'Air', modality: 'Fixed', color: '#06b6d4' },
  'Pisces': { symbol: '♓', element: 'Water', modality: 'Mutable', color: '#14b8a6' },
};

// Get zodiac sign from longitude
function getSignFromLongitude(longitude: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const index = Math.floor(longitude / 30) % 12;
  return signs[index];
}

// Get degree within sign
function getDegreeInSign(longitude: number): number {
  return Math.floor(longitude % 30);
}

// Get minute within degree
function getMinuteInDegree(longitude: number): number {
  return Math.floor((longitude % 1) * 60);
}

export function NatalChartsSection({
  personA,
  personB,
  expertMode,
  className = ''
}: NatalChartsSectionProps) {
  const hasNatalData = personA.natalChart || personB.natalChart;

  if (!hasNatalData) {
    return null;
  }

  return (
    <Card className={`bg-card border shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-purple-500" />
          Individual Birth Charts
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {expertMode
            ? 'Natal planetary positions showing sign, degree, and house placements for both individuals.'
            : 'See where each planet was positioned at the moment of birth. Each planet represents a different part of your personality.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="person-a" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="person-a" className="data-[state=active]:bg-card">
              {personA.name}
            </TabsTrigger>
            <TabsTrigger value="person-b" className="data-[state=active]:bg-card">
              {personB.name}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="person-a">
            <NatalChartDisplay
              person={personA}
              expertMode={expertMode}
              accentColor="purple"
            />
          </TabsContent>

          <TabsContent value="person-b">
            <NatalChartDisplay
              person={personB}
              expertMode={expertMode}
              accentColor="pink"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface NatalChartDisplayProps {
  person: PersonData;
  expertMode: boolean;
  accentColor: 'purple' | 'pink';
}

function NatalChartDisplay({ person, expertMode, accentColor }: NatalChartDisplayProps) {
  const colorClasses = accentColor === 'purple'
    ? { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' }
    : { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' };

  if (!person.natalChart) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Natal chart data not available for {person.name}.</p>
      </div>
    );
  }

  const { planets, angles, houses } = person.natalChart;

  return (
    <div className="space-y-6 pt-4">
      {/* Birth Info Header */}
      <div className={`p-4 rounded-lg ${colorClasses.bg} ${colorClasses.border} border`}>
        <h4 className={`font-semibold ${colorClasses.text} mb-2`}>{person.name}'s Birth Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{person.birthDate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{person.birthTime || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{person.birthCity || 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Angles (Ascendant & Midheaven) */}
      {angles && (
        <div className="grid grid-cols-2 gap-4">
          <AngleCard
            name="Ascendant (Rising Sign)"
            longitude={angles.ascendant}
            expertMode={expertMode}
            description="How others see you; your outer personality"
          />
          <AngleCard
            name="Midheaven (MC)"
            longitude={angles.midheaven}
            expertMode={expertMode}
            description="Your career path and public image"
          />
        </div>
      )}

      {/* Planet Positions */}
      <div>
        <h5 className="font-medium text-foreground mb-3">Planetary Positions</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLANET_ORDER.map((planetKey) => {
            const planet = planets[planetKey] || planets[planetKey.toLowerCase()];
            if (!planet) return null;

            const planetInfo = PLANETS[planetKey] || PLANETS[planetKey.toLowerCase()];
            if (!planetInfo) return null;

            const sign = planet.sign || getSignFromLongitude(planet.longitude);
            const signData = ZODIAC_SIGNS[sign];
            const degree = getDegreeInSign(planet.longitude);
            const minute = getMinuteInDegree(planet.longitude);

            return (
              <div
                key={planetKey}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-2xl"
                    style={{ color: planetInfo.color }}
                    title={planetInfo.name}
                  >
                    {planetInfo.symbol}
                  </span>
                  <div>
                    <div className="font-medium text-foreground">
                      {planetInfo.name}
                      {planet.retrograde && (
                        <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-300">
                          R
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {expertMode ? planetInfo.expertDesc : planetInfo.simpleDesc}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span style={{ color: signData?.color }} className="text-lg">
                      {signData?.symbol}
                    </span>
                    <span className="font-medium text-foreground">{sign}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {expertMode ? (
                      <>
                        {degree}°{minute.toString().padStart(2, '0')}'
                        {planet.house && <span className="ml-1">(H{planet.house})</span>}
                      </>
                    ) : (
                      <>{degree}°</>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Element & Modality Summary */}
      <ElementSummary planets={planets} expertMode={expertMode} />
    </div>
  );
}

interface AngleCardProps {
  name: string;
  longitude: number;
  expertMode: boolean;
  description: string;
}

function AngleCard({ name, longitude, expertMode, description }: AngleCardProps) {
  const sign = getSignFromLongitude(longitude);
  const signData = ZODIAC_SIGNS[sign];
  const degree = getDegreeInSign(longitude);
  const minute = getMinuteInDegree(longitude);

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
      <div className="text-sm text-indigo-600 font-medium mb-1">{name}</div>
      <div className="flex items-center gap-2">
        <span style={{ color: signData?.color }} className="text-2xl">
          {signData?.symbol}
        </span>
        <div>
          <div className="font-semibold text-foreground">{sign}</div>
          <div className="text-sm text-muted-foreground">
            {expertMode ? `${degree}°${minute.toString().padStart(2, '0')}'` : `${degree}°`}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

interface ElementSummaryProps {
  planets: Record<string, { longitude: number; sign?: string }>;
  expertMode: boolean;
}

function ElementSummary({ planets, expertMode }: ElementSummaryProps) {
  // Count elements and modalities
  const counts = {
    Fire: 0, Earth: 0, Air: 0, Water: 0,
    Cardinal: 0, Fixed: 0, Mutable: 0
  };

  Object.values(planets).forEach(planet => {
    const sign = planet.sign || getSignFromLongitude(planet.longitude);
    const signData = ZODIAC_SIGNS[sign];
    if (signData) {
      counts[signData.element as keyof typeof counts]++;
      counts[signData.modality as keyof typeof counts]++;
    }
  });

  const elementColors = {
    Fire: 'bg-red-100 text-red-700 border-red-200',
    Earth: 'bg-green-100 text-green-700 border-green-200',
    Air: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Water: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const modalityColors = {
    Cardinal: 'bg-purple-100 text-purple-700 border-purple-200',
    Fixed: 'bg-orange-100 text-orange-700 border-orange-200',
    Mutable: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border">
      <h5 className="font-medium text-foreground mb-3">Element & Modality Balance</h5>

      <div className="grid grid-cols-2 gap-4">
        {/* Elements */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Elements</div>
          <div className="flex flex-wrap gap-2">
            {(['Fire', 'Earth', 'Air', 'Water'] as const).map(element => (
              <Badge
                key={element}
                variant="outline"
                className={`${elementColors[element]} border`}
              >
                {element}: {counts[element]}
              </Badge>
            ))}
          </div>
          {expertMode && (
            <p className="text-xs text-muted-foreground mt-2">
              {counts.Fire > 3 ? 'Fire dominant: energetic, passionate' :
               counts.Earth > 3 ? 'Earth dominant: practical, grounded' :
               counts.Air > 3 ? 'Air dominant: intellectual, social' :
               counts.Water > 3 ? 'Water dominant: emotional, intuitive' :
               'Balanced elemental distribution'}
            </p>
          )}
        </div>

        {/* Modalities */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Modalities</div>
          <div className="flex flex-wrap gap-2">
            {(['Cardinal', 'Fixed', 'Mutable'] as const).map(modality => (
              <Badge
                key={modality}
                variant="outline"
                className={`${modalityColors[modality]} border`}
              >
                {modality}: {counts[modality]}
              </Badge>
            ))}
          </div>
          {expertMode && (
            <p className="text-xs text-muted-foreground mt-2">
              {counts.Cardinal > 4 ? 'Cardinal dominant: initiator, leader' :
               counts.Fixed > 4 ? 'Fixed dominant: persistent, determined' :
               counts.Mutable > 4 ? 'Mutable dominant: adaptable, flexible' :
               'Balanced modal distribution'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NatalChartsSection;
