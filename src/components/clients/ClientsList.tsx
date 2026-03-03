/**
 * Client Directory List
 * Inline list of clients for the Settings page
 */

import { useState, useMemo } from 'react';
import { Search, Trash2, Pencil, Check, X, ExternalLink, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  loadClients, addClient, updateClient, deleteClient, searchClients,
  extractPersonsFromCharts, type Client,
} from '@/lib/clients';
import { useNavigate } from 'react-router-dom';

interface ClientsListProps {
  savedCharts?: any[];
}

export function ClientsList({ savedCharts = [] }: ClientsListProps) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>(() => loadClients());
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newLocation, setNewLocation] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return clients;
    return searchClients(query);
  }, [clients, query]);

  const importable = useMemo(() => {
    if (!savedCharts.length) return [];
    return extractPersonsFromCharts(savedCharts);
  }, [savedCharts, clients]);

  const handleDelete = (id: string) => {
    deleteClient(id);
    setClients(loadClients());
    toast.success('Client removed');
  };

  const handleSaveEdit = (id: string) => {
    updateClient(id, { name: editName, notes: editNotes });
    setClients(loadClients());
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) { toast.error('Name is required'); return; }
    addClient({
      name: newName.trim(),
      birthDate: newDate,
      birthTime: newTime || '12:00',
      birthLocation: newLocation,
      lat: null,
      lng: null,
      notes: '',
    });
    setClients(loadClients());
    setShowAdd(false);
    setNewName('');
    setNewDate('');
    setNewTime('12:00');
    setNewLocation('');
    toast.success('Client added');
  };

  const handleImportAll = () => {
    let count = 0;
    for (const p of importable) {
      addClient(p);
      count++;
    }
    setClients(loadClients());
    toast.success(`Imported ${count} client${count !== 1 ? 's' : ''} from saved charts`);
  };

  const handleLoadIntoChart = (client: Client) => {
    navigate('/chart', {
      state: {
        loadClient: {
          name: client.name,
          date: client.birthDate,
          time: client.birthTime,
          location: client.birthLocation,
          lat: client.lat,
          lng: client.lng,
        },
      },
    });
  };

  const shortLocation = (loc: string) => {
    if (!loc) return '';
    const parts = loc.split(',').map(s => s.trim());
    if (parts.length <= 2) return loc;
    return `${parts[0]}, ${parts[parts.length - 2] || parts[1]}`;
  };

  return (
    <div className="space-y-3">
      {/* Search + Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1 text-xs h-7">
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      {/* Import from saved charts */}
      {importable.length > 0 && (
        <button
          onClick={handleImportAll}
          className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 hover:text-foreground hover:border-foreground/30 hover:bg-muted/30 transition-all"
        >
          <Download className="w-3 h-3" />
          Import {importable.length} person{importable.length !== 1 ? 's' : ''} from saved charts
        </button>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="border border-border/50 rounded-lg p-3 space-y-2 bg-muted/20">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="px-2.5 py-1.5 text-xs rounded-md border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="px-2.5 py-1.5 text-xs rounded-md border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Location" className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs h-7">Cancel</Button>
            <Button size="sm" onClick={handleAdd} className="text-xs h-7">Save</Button>
          </div>
        </div>
      )}

      {/* Client list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-6">
          {clients.length === 0 ? 'No clients yet' : 'No matches'}
        </p>
      ) : (
        <div className="border border-border/50 rounded-lg divide-y divide-border/30 overflow-hidden">
          {filtered.map(client => (
            <div key={client.id} className="px-3 py-2.5 hover:bg-muted/30 transition-colors">
              {editingId === client.id ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Notes..."
                    rows={2}
                    className="w-full px-2 py-1 text-xs rounded border border-border/50 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditingId(null)} className="p-1 rounded text-muted-foreground hover:bg-muted"><X className="w-3 h-3" /></button>
                    <button onClick={() => handleSaveEdit(client.id)} className="p-1 rounded text-green-600 hover:bg-green-500/10"><Check className="w-3 h-3" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{client.name}</div>
                    <div className="text-[11px] text-muted-foreground/60">
                      {client.birthDate && new Date(client.birthDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {client.birthTime && client.birthTime !== '12:00' && <> &middot; {client.birthTime}</>}
                      {client.birthLocation && <> &middot; {shortLocation(client.birthLocation)}</>}
                    </div>
                    {client.notes && <div className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">{client.notes}</div>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleLoadIntoChart(client)}
                      className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                      title="Load into chart"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => { setEditingId(client.id); setEditName(client.name); setEditNotes(client.notes); }}
                      className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40 text-center">
        {clients.length} client{clients.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
