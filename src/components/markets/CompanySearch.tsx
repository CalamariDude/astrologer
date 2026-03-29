import { useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { COMPANIES, SECTORS, type Company, type Sector } from '@/data/companies';

interface CompanySearchProps {
  onSelect: (company: Company | null, ticker: string) => void;
  customCompanies: Company[];
  onAddCompany: () => void;
  sectorFilter: string;
  onSectorFilterChange: (sector: string) => void;
}

export function CompanySearch({ onSelect, customCompanies, onAddCompany, sectorFilter, onSectorFilterChange }: CompanySearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const allCompanies = [...COMPANIES, ...customCompanies];
  const filtered = allCompanies.filter(c => {
    const matchesQuery = !query || c.ticker.toLowerCase().includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase());
    const matchesSector = !sectorFilter || c.sector === sectorFilter;
    return matchesQuery && matchesSector;
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (company: Company) => {
    onSelect(company, company.ticker);
    setQuery('');
    setOpen(false);
  };

  const handleFreeTicker = () => {
    if (!query.trim()) return;
    onSelect(null, query.trim().toUpperCase());
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div ref={wrapperRef} className="relative flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ticker or company..."
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="pl-9"
          />
        </div>

        {open && query && (
          <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg max-h-72 overflow-y-auto">
            {filtered.slice(0, 10).map(c => (
              <button
                key={c.ticker + c.exchange}
                onClick={() => handleSelect(c)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
              >
                <span>
                  <span className="font-medium">{c.ticker}</span>
                  <span className="text-muted-foreground ml-2">{c.name}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">{c.sector}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No companies found</div>
            )}
            <button
              onClick={handleFreeTicker}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent border-t text-muted-foreground"
            >
              Use &lsquo;<span className="font-medium text-foreground">{query.toUpperCase()}</span>&rsquo; as ticker
            </button>
          </div>
        )}
      </div>

      <select
        value={sectorFilter}
        onChange={e => onSectorFilterChange(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All Sectors</option>
        {SECTORS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <Button variant="outline" size="sm" className="h-10 shrink-0" onClick={onAddCompany}>
        <Plus className="w-4 h-4 mr-1" />
        Add Company
      </Button>
    </div>
  );
}
