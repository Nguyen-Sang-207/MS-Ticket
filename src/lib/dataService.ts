/**
 * dataService - Unified data fetching layer with fallback chain:
 *   1. Try Firestore API
 *   2. On quota/network error -> fall back to backup-db.json
 *   3. Merge result with sandbox overrides (for guest users)
 */

import { sandboxMerge } from './sandboxStore';

type Collection = 'movies' | 'theaters' | 'actors' | 'showtimes' | 'rooms' | 'combos' | 'promotions' | 'pricing';

// API endpoint map
const API_MAP: Record<Collection, string> = {
  movies: '/api/movies?limit=100',
  theaters: '/api/theaters',
  actors: '/api/actors',
  showtimes: '/api/showtimes',
  rooms: '/api/rooms',
  combos: '/api/combos',
  promotions: '/api/promotions',
  pricing: '/api/pricing',
};

let backupCache: Record<string, any[]> | null = null;

/** Load and cache the backup JSON file */
async function loadBackup(): Promise<Record<string, any[]>> {
  if (backupCache) return backupCache;
  try {
    const res = await fetch('/data/backup-db.json');
    if (!res.ok) throw new Error('Backup not found');
    const json = await res.json();
    backupCache = json.collections || {};
    return backupCache!;
  } catch {
    return {};
  }
}

/** Signals that Firebase is unavailable - stored in sessionStorage */
const QUOTA_FLAG = '__cineme_quota_exceeded__';

export function isFirebaseDown(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(QUOTA_FLAG) === '1';
}

function markFirebaseDown(): void {
  if (typeof window !== 'undefined') sessionStorage.setItem(QUOTA_FLAG, '1');
}

export function clearFirebaseDownFlag(): void {
  if (typeof window !== 'undefined') sessionStorage.removeItem(QUOTA_FLAG);
}

/**
 * Fetch a collection with automatic fallback chain.
 * Returns docs merged with any sandbox overrides for the current user.
 */
export async function fetchCollection(
  collection: Collection,
  options: { applySandbox?: boolean } = {}
): Promise<any[]> {
  const { applySandbox = true } = options;
  let docs: any[] = [];

  if (!isFirebaseDown()) {
    try {
      const res = await fetch(API_MAP[collection]);
      if (res.status === 429 || res.status === 503) {
        markFirebaseDown();
        throw new Error('Quota exceeded');
      }
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      if (json.message && json.message.includes('Fallback')) {
        markFirebaseDown();
        emitOfflineState(true);
      }
      docs = json.data || json || [];
    } catch (err: any) {
      console.warn(`[dataService] Firebase failed for "${collection}", using backup.`, err?.message);
      const backup = await loadBackup();
      docs = backup[collection] || [];
    }
  } else {
    // Firebase is known to be down - use backup directly
    const backup = await loadBackup();
    docs = backup[collection] || [];
  }

  // Apply sandbox overrides on top
  if (applySandbox) {
    docs = sandboxMerge(collection, docs);
  }

  return docs;
}

/** Banner state for the offline indicator - notified via event */
export function emitOfflineState(isOffline: boolean): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cineme:offline', { detail: { isOffline } }));
  }
}
