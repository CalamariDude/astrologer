const SPECIALTIES = [
  'Natal', 'Synastry', 'Horary', 'Electional', 'Vedic', 'Evolutionary',
  'Medical', 'Mundane', 'Financial', 'Hellenistic', 'Traditional', 'Modern',
];

interface Props {
  specialty: string | null;
  onSpecialtyChange: (s: string | null) => void;
  virtual: boolean;
  inPerson: boolean;
  onVirtualChange: (v: boolean) => void;
  onInPersonChange: (v: boolean) => void;
}

export function PractitionerFilters({ specialty, onSpecialtyChange, virtual, inPerson, onVirtualChange, onInPersonChange }: Props) {
  return (
    <div className="space-y-4">
      {/* Specialty pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSpecialtyChange(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !specialty
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {SPECIALTIES.map(s => (
          <button
            key={s}
            onClick={() => onSpecialtyChange(specialty === s ? null : s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              specialty === s
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Session type toggles */}
      <div className="flex gap-3">
        <button
          onClick={() => onVirtualChange(!virtual)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            virtual
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-border/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          Virtual
        </button>
        <button
          onClick={() => onInPersonChange(!inPerson)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            inPerson
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-border/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          In Person
        </button>
      </div>
    </div>
  );
}
