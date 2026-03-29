import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, HeartCrack, HelpCircle, Loader2, TrendingUp } from 'lucide-react';

interface MarriagePredictionResult {
  classification: 'long_marriage_likely' | 'short_marriage_likely' | 'unknown';
  probability_long_marriage: number;
  confidence: number;
  threshold: number;
}

interface MarriagePredictionBoxProps {
  birthDateA: string;
  birthDateB: string;
}

const API_URL = 'https://druzematch.fly.dev';
const API_SECRET = import.meta.env.VITE_SWISSEPH_API_SECRET;

export function MarriagePredictionBox({ birthDateA, birthDateB }: MarriagePredictionBoxProps) {
  const [prediction, setPrediction] = useState<MarriagePredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!birthDateA || !birthDateB) {
      setLoading(false);
      return;
    }

    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/predict-compatibility`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_SECRET}`,
          },
          body: JSON.stringify({
            dob_a: birthDateA.slice(0, 10),
            dob_b: birthDateB.slice(0, 10),
          }),
        });

        if (!response.ok) {
          throw new Error('Prediction service unavailable');
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setPrediction(data);
      } catch (err: any) {
        setError(err.message || 'Failed to get prediction');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [birthDateA, birthDateB]);

  if (loading) {
    return (
      <Card className="bg-card border shadow-sm">
        <CardContent className="py-4 flex items-center justify-center gap-2 text-muted-foreground/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing relationship longevity...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return null;
  }

  const { classification, probability_long_marriage, confidence, threshold } = prediction;
  const probabilityPct = Math.round(probability_long_marriage * 100);
  const confidencePct = Math.round(confidence * 100);

  // Determine the label and description based on probability zones
  const getZoneInfo = () => {
    if (probability_long_marriage >= threshold) {
      return {
        label: 'Long Marriage Likely',
        description: 'Strong indicators for lasting partnership',
        icon: Heart,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    } else if (probability_long_marriage <= (1 - threshold)) {
      return {
        label: 'Challenging Match',
        description: 'Indicators suggest potential difficulties',
        icon: HeartCrack,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    } else {
      return {
        label: 'Mixed Signals',
        description: 'Balanced indicators - could go either way',
        icon: HelpCircle,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
  };

  const zoneInfo = getZoneInfo();
  const Icon = zoneInfo.icon;

  // Calculate marker position (0-100%)
  const markerPosition = probabilityPct;

  // Gradient colors for the slider
  const sliderGradient = 'linear-gradient(to right, #f43f5e 0%, #f43f5e 25%, #fbbf24 25%, #fbbf24 75%, #10b981 75%, #10b981 100%)';

  return (
    <Card className="bg-card border shadow-sm overflow-hidden">
      <CardContent className="py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-foreground">Longevity Prediction</span>
          </div>
          <Badge variant="outline" className={zoneInfo.badgeClass}>
            <Icon className="w-3 h-3 mr-1" />
            {zoneInfo.label}
          </Badge>
        </div>

        {/* Probability Slider */}
        <div className="mb-4">
          <div className="relative h-8 rounded-full overflow-hidden" style={{ background: sliderGradient }}>
            {/* Zone labels inside the bar */}
            <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-white/90">
              <span className="drop-shadow">Short</span>
              <span className="drop-shadow">Uncertain</span>
              <span className="drop-shadow">Long</span>
            </div>

            {/* Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-card shadow-lg transition-all duration-500"
              style={{
                left: `calc(${markerPosition}% - 2px)`,
                boxShadow: '0 0 8px rgba(0,0,0,0.4)'
              }}
            />

            {/* Probability label above marker */}
            <div
              className="absolute -top-6 transform -translate-x-1/2 transition-all duration-500"
              style={{ left: `${markerPosition}%` }}
            >
              <span className="text-xs font-bold text-foreground bg-card px-1.5 py-0.5 rounded shadow-sm border">
                {probabilityPct}%
              </span>
            </div>
          </div>

          {/* Scale labels */}
          <div className="flex justify-between mt-1 text-xs text-muted-foreground/60">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Long Marriage Probability</div>
            <div className="text-lg font-bold text-foreground">{probabilityPct}%</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Model Confidence</div>
            <div className="text-lg font-bold text-foreground">{confidencePct}%</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-2">
          {zoneInfo.description}
        </p>

        {/* Footnote */}
        <p className="text-xs text-muted-foreground/60">
          ML model trained on 2,388 marriages. Predictions at extremes ({"<"}25% or {">"}75%) have ~87% accuracy.
        </p>
      </CardContent>
    </Card>
  );
}
