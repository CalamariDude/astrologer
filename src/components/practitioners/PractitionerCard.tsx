import { Link } from 'react-router-dom';
import { MapPin, Monitor, Users, BadgeCheck } from 'lucide-react';
import type { Practitioner } from '@/hooks/usePractitioners';

function formatRate(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return null;
  const fmt = (cents: number) => `$${Math.round(cents / 100)}`;
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}/hr`;
  return `${fmt(min || max!)}/hr`;
}

export function PractitionerCard({ p }: { p: Practitioner }) {
  const rate = formatRate(p.hourly_rate_min, p.hourly_rate_max, p.currency);

  return (
    <Link
      to={`/astrologers/${p.slug}`}
      className={`group block rounded-2xl border p-5 transition-all hover:shadow-lg hover:border-border ${
        p.is_featured
          ? 'border-amber-500/30 bg-amber-500/[0.02]'
          : 'border-border/50 bg-card'
      }`}
    >
      <div className="flex items-start gap-4">
        {p.photo_url ? (
          <img
            src={p.photo_url}
            alt={p.display_name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground flex-shrink-0">
            {p.display_name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {p.display_name}
            </h3>
            {p.is_verified && (
              <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          {p.headline && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{p.headline}</p>
          )}
        </div>
      </div>

      {p.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {p.specialties.slice(0, 3).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/5 text-primary/70 border border-primary/10">
              {s}
            </span>
          ))}
          {p.specialties.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] text-muted-foreground">
              +{p.specialties.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        {p.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {p.location}
          </span>
        )}
        {p.offers_virtual && (
          <span className="flex items-center gap-1">
            <Monitor className="w-3 h-3" /> Virtual
          </span>
        )}
        {p.offers_in_person && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> In Person
          </span>
        )}
        {rate && <span className="ml-auto font-medium text-foreground/70">{rate}</span>}
      </div>
    </Link>
  );
}
