import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/TimeInput';
import { SECTORS, type Company } from '@/data/companies';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (company: Company) => void;
}

const STORAGE_KEY = 'markets-custom-companies';

export function AddCompanyDialog({ open, onOpenChange, onSave }: AddCompanyDialogProps) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [incDate, setIncDate] = useState('');
  const [incTime, setIncTime] = useState('');
  const [location, setLocation] = useState('');
  const [sector, setSector] = useState('Technology');

  const canSave = ticker.trim() && name.trim() && incDate;

  const handleSave = () => {
    if (!canSave) return;

    const company: Company = {
      ticker: ticker.trim().toUpperCase(),
      exchange: 'CUSTOM',
      name: name.trim(),
      incorporationDate: incDate,
      incorporationTime: incTime || undefined,
      incorporationLocation: location.trim() || 'Unknown',
      lat: 0,
      lng: 0,
      sector,
    };

    // Save to localStorage
    const existing: Company[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(company);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    onSave(company);
    onOpenChange(false);

    // Reset form
    setTicker('');
    setName('');
    setIncDate('');
    setIncTime('');
    setLocation('');
    setSector('Technology');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
          <DialogDescription>Add a custom company for financial astrology analysis.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ticker">Ticker *</Label>
              <Input id="ticker" placeholder="AAPL" value={ticker} onChange={e => setTicker(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sector">Sector</Label>
              <select
                id="sector"
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Company Name *</Label>
            <Input id="name" placeholder="Apple Inc." value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="incDate">Incorporation Date *</Label>
              <Input id="incDate" type="date" value={incDate} onChange={e => setIncDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="incTime">Time (optional)</Label>
              <TimeInput value={incTime} onChange={setIncTime} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Incorporation Location</Label>
            <Input id="location" placeholder="City, State, Country" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave} onClick={handleSave}>Save Company</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
