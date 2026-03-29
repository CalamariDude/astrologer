/**
 * Client Directory
 * Manage people/clients with birth data, stored in localStorage
 */

export interface Client {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  lat: number | null;
  lng: number | null;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = 'astrologer-clients';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Client[];
  } catch {
    return [];
  }
}

function saveClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export function addClient(data: Omit<Client, 'id' | 'createdAt'>): Client {
  const clients = loadClients();
  const client: Client = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  saveClients(clients);
  return client;
}

export function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>): void {
  const clients = loadClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx >= 0) {
    clients[idx] = { ...clients[idx], ...updates };
    saveClients(clients);
  }
}

export function deleteClient(id: string): void {
  const clients = loadClients().filter(c => c.id !== id);
  saveClients(clients);
}

export function searchClients(query: string): Client[] {
  const clients = loadClients();
  if (!query.trim()) return clients;
  const q = query.toLowerCase();
  return clients.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.birthLocation.toLowerCase().includes(q)
  );
}

/**
 * Extract unique persons from saved charts to offer as client imports
 */
export function extractPersonsFromCharts(
  charts: { person_a_name?: string; person_a_date: string; person_a_time: string; person_a_location?: string; person_a_lat?: number | null; person_a_lng?: number | null; person_b_name?: string; person_b_date?: string | null; person_b_time?: string | null; person_b_location?: string | null; person_b_lat?: number | null; person_b_lng?: number | null }[]
): Omit<Client, 'id' | 'createdAt'>[] {
  const seen = new Set<string>();
  const persons: Omit<Client, 'id' | 'createdAt'>[] = [];
  const existing = loadClients();
  const existingKeys = new Set(existing.map(c => `${c.name}|${c.birthDate}`));

  for (const c of charts) {
    if (c.person_a_name && c.person_a_date) {
      const key = `${c.person_a_name}|${c.person_a_date}`;
      if (!seen.has(key) && !existingKeys.has(key)) {
        seen.add(key);
        persons.push({
          name: c.person_a_name,
          birthDate: c.person_a_date,
          birthTime: c.person_a_time || '12:00',
          birthLocation: c.person_a_location || '',
          lat: c.person_a_lat ?? null,
          lng: c.person_a_lng ?? null,
          notes: '',
        });
      }
    }
    if (c.person_b_name && c.person_b_date) {
      const key = `${c.person_b_name}|${c.person_b_date}`;
      if (!seen.has(key) && !existingKeys.has(key)) {
        seen.add(key);
        persons.push({
          name: c.person_b_name,
          birthDate: c.person_b_date,
          birthTime: c.person_b_time || '12:00',
          birthLocation: c.person_b_location || '',
          lat: c.person_b_lat ?? null,
          lng: c.person_b_lng ?? null,
          notes: '',
        });
      }
    }
  }

  return persons;
}
