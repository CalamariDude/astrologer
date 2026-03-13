/**
 * Toolbox Wrapper — lazy-loads and renders the selected tool panel
 * Sits in the analysis area of ChartPage, replacing tabs when a tool is open
 */

import React, { Suspense } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TOOLS } from './ToolboxMenu';

// Lazy-load all tool panels
const ZodiacalReleasingPanel = React.lazy(() => import('./ZodiacalReleasingPanel').then(m => ({ default: m.ZodiacalReleasingPanel })));
const FirdariaPanel = React.lazy(() => import('./FirdariaPanel').then(m => ({ default: m.FirdariaPanel })));
const DominantPlanetsPanel = React.lazy(() => import('./DominantPlanetsPanel').then(m => ({ default: m.DominantPlanetsPanel })));
const PlanetaryHoursPanel = React.lazy(() => import('./PlanetaryHoursPanel').then(m => ({ default: m.PlanetaryHoursPanel })));
const SabianSymbolsPanel = React.lazy(() => import('./SabianSymbolsPanel').then(m => ({ default: m.SabianSymbolsPanel })));
const AntisciaPanel = React.lazy(() => import('./AntisciaPanel').then(m => ({ default: m.AntisciaPanel })));
const DraconicPanel = React.lazy(() => import('./DraconicPanel').then(m => ({ default: m.DraconicPanel })));
const ChartShapePanel = React.lazy(() => import('./ChartShapePanel').then(m => ({ default: m.ChartShapePanel })));
const DavisonPanel = React.lazy(() => import('./DavisonPanel').then(m => ({ default: m.DavisonPanel })));
const VoidOfCourseMoonPanel = React.lazy(() => import('./VoidOfCourseMoonPanel').then(m => ({ default: m.VoidOfCourseMoonPanel })));
const MidpointTreesPanel = React.lazy(() => import('./MidpointTreesPanel').then(m => ({ default: m.MidpointTreesPanel })));
const RetrogradeCalendarPanel = React.lazy(() => import('./RetrogradeCalendarPanel').then(m => ({ default: m.RetrogradeCalendarPanel })));
const EclipseTrackerPanel = React.lazy(() => import('./EclipseTrackerPanel').then(m => ({ default: m.EclipseTrackerPanel })));
const ArabicPartsEditorPanel = React.lazy(() => import('./ArabicPartsEditorPanel').then(m => ({ default: m.ArabicPartsEditorPanel })));
const AlmutenPanel = React.lazy(() => import('./AlmutenPanel').then(m => ({ default: m.AlmutenPanel })));
const PrimaryDirectionsPanel = React.lazy(() => import('./PrimaryDirectionsPanel').then(m => ({ default: m.PrimaryDirectionsPanel })));
const DailyProfectionsPanel = React.lazy(() => import('./DailyProfectionsPanel').then(m => ({ default: m.DailyProfectionsPanel })));
const ProgressedMoonPanel = React.lazy(() => import('./ProgressedMoonPanel').then(m => ({ default: m.ProgressedMoonPanel })));

const DynamicHitsPanel = React.lazy(() => import('./DynamicHitsPanel').then(m => ({ default: m.DynamicHitsPanel })));
const PlanetaryReturnsPanel = React.lazy(() => import('./PlanetaryReturnsPanel').then(m => ({ default: m.PlanetaryReturnsPanel })));
const UranianEphemerisPanel = React.lazy(() => import('./UranianEphemerisPanel').then(m => ({ default: m.UranianEphemerisPanel })));
const SkyMapPanel = React.lazy(() => import('./SkyMapPanel').then(m => ({ default: m.SkyMapPanel })));
const EclipseMapsPanel = React.lazy(() => import('./EclipseMapsPanel').then(m => ({ default: m.EclipseMapsPanel })));

interface ChartData {
  natalChart: any;
  name: string;
  date: string;
  time: string;
  lat: number;
  lng: number;
}

interface ToolboxWrapperProps {
  toolId: string;
  onBack: () => void;
  personA: ChartData;
  personB?: ChartData;
}

export function ToolboxWrapper({ toolId, onBack, personA, personB }: ToolboxWrapperProps) {
  const toolDef = TOOLS.find(t => t.id === toolId);
  const label = toolDef?.label || toolId;

  return (
    <div className="mt-4 min-h-[400px]">
      {/* Back bar */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to tabs
        <span className="text-muted-foreground/60 mx-1">·</span>
        <span className="font-medium text-foreground/80">{label}</span>
      </button>

      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }>
        {renderTool(toolId, personA, personB)}
      </Suspense>
    </div>
  );
}

function renderTool(toolId: string, personA: ChartData, personB?: ChartData) {
  const chart = personA.natalChart;
  const birthDate = personA.date;
  const name = personA.name;

  switch (toolId) {
    case 'zodiacal-releasing':
      return <ZodiacalReleasingPanel natalChart={chart} birthDate={birthDate} name={name} />;
    case 'firdaria':
      return <FirdariaPanel natalChart={chart} birthDate={birthDate} name={name} />;
    case 'dominant-planets':
      return <DominantPlanetsPanel natalChart={chart} name={name} />;
    case 'planetary-hours':
      return <PlanetaryHoursPanel birthDate={birthDate} lat={personA.lat} lng={personA.lng} />;
    case 'sabian-symbols':
      return <SabianSymbolsPanel natalChart={chart} name={name} />;
    case 'antiscia':
      return <AntisciaPanel natalChart={chart} name={name} />;
    case 'draconic':
      return <DraconicPanel natalChart={chart} name={name} />;
    case 'chart-shape':
      return <ChartShapePanel natalChart={chart} name={name} />;
    case 'davison':
      if (!personB) return <NeedsTwoCharts />;
      return (
        <DavisonPanel
          birthInfoA={{ date: personA.date, time: personA.time, lat: personA.lat, lng: personA.lng, name: personA.name }}
          birthInfoB={{ date: personB.date, time: personB.time, lat: personB.lat, lng: personB.lng, name: personB.name }}
        />
      );
    case 'void-of-course':
      return <VoidOfCourseMoonPanel lat={personA.lat} lng={personA.lng} />;
    case 'midpoint-trees':
      return <MidpointTreesPanel natalChart={chart} name={name} />;
    case 'retrograde-calendar':
      return <RetrogradeCalendarPanel lat={personA.lat} lng={personA.lng} />;
    case 'eclipse-tracker':
      return <EclipseTrackerPanel natalChart={chart} birthDate={birthDate} name={name} />;
    case 'arabic-parts':
      return <ArabicPartsEditorPanel natalChart={chart} name={name} />;
    case 'almuten':
      return <AlmutenPanel natalChart={chart} name={name} />;
    case 'primary-directions':
      return <PrimaryDirectionsPanel natalChart={chart} birthDate={birthDate} name={name} lat={personA.lat} />;
    case 'daily-profections':
      return <DailyProfectionsPanel natalChart={chart} birthDate={birthDate} name={name} />;
    case 'progressed-moon':
      return <ProgressedMoonPanel natalChart={chart} birthDate={birthDate} name={name} />;

    case 'dynamic-hits':
      return <DynamicHitsPanel natalChart={chart} birthDate={birthDate} name={name} />;
    case 'planetary-returns':
      return <PlanetaryReturnsPanel natalChart={chart} birthDate={birthDate} name={name} lat={personA.lat} lng={personA.lng} />;
    case 'uranian-ephemeris':
      return <UranianEphemerisPanel natalChart={chart} birthDate={birthDate} name={name} />;
    case 'sky-map':
      return <SkyMapPanel natalChart={chart} birthDate={birthDate} birthTime={personA.time} name={name} lat={personA.lat} lng={personA.lng} />;
    case 'eclipse-maps':
      return <EclipseMapsPanel natalChart={chart} name={name} />;

    default:
      return <ComingSoon toolId={toolId} />;
  }
}

function NeedsTwoCharts() {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <p className="text-sm font-medium">Two charts required</p>
      <p className="text-xs mt-1">Load a second chart to use this tool.</p>
    </div>
  );
}

function ComingSoon({ toolId }: { toolId: string }) {
  const toolDef = TOOLS.find(t => t.id === toolId);
  return (
    <div className="text-center py-16 text-muted-foreground">
      <p className="text-sm font-medium">{toolDef?.label || toolId}</p>
      <p className="text-xs mt-1">{toolDef?.description}</p>
      <p className="text-xs mt-3 text-muted-foreground/70">Coming soon</p>
    </div>
  );
}
