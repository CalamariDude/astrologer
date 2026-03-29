import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sun, Calendar, Activity } from 'lucide-react';
import type { Company } from '@/data/companies';

interface CompanyBirthChartProps {
  company: Company;
}

export function getSunSign(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  const signs: [number, number, string][] = [
    [1, 20, 'Capricorn'], [2, 19, 'Aquarius'], [3, 20, 'Pisces'],
    [4, 20, 'Aries'], [5, 21, 'Taurus'], [6, 21, 'Gemini'],
    [7, 22, 'Cancer'], [8, 23, 'Leo'], [9, 23, 'Virgo'],
    [10, 23, 'Libra'], [11, 22, 'Scorpio'], [12, 22, 'Sagittarius'],
  ];
  for (let i = signs.length - 1; i >= 0; i--) {
    if (month > signs[i][0] || (month === signs[i][0] && day >= signs[i][1])) {
      return signs[i][2];
    }
  }
  return 'Capricorn';
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function CompanyBirthChart({ company }: CompanyBirthChartProps) {
  const navigate = useNavigate();
  const sunSign = getSunSign(company.incorporationDate);

  const navigateToChart = (date: string, label: string, withTransits = false) => {
    navigate('/chart', {
      state: {
        loadClient: {
          name: `${company.name} (${label})`,
          date,
          time: company.incorporationTime || '12:00',
          location: company.incorporationLocation,
          lat: company.lat,
          lng: company.lng,
          autoCalculate: true,
          withTransits,
        },
      },
    });
    window.scrollTo(0, 0);
  };

  return (
    <Card>
      <CardContent className="pt-5 pb-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{company.name}</span>
            <Badge variant="outline" className="text-[10px]">{company.sector}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{company.ticker} &middot; {company.exchange}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Founded {formatDate(company.incorporationDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Sun in <span className="font-medium">{sunSign}</span></span>
          </div>
          <div className="text-xs text-muted-foreground">{company.incorporationLocation}</div>
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigateToChart(company.incorporationDate, 'Inc.')}>
            View Birth Chart
          </Button>
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigateToChart(company.incorporationDate, 'Inc.', true)}>
            <Activity className="w-3 h-3 mr-1" />
            Birth Chart + Current Transits
          </Button>
          {company.ipoDate && (
            <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => navigateToChart(company.ipoDate!, 'IPO')}>
              View IPO Chart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
