'use client';

import { SANDBOX_KEY_PREFIX } from './masterConfig';

/**
 * Sandbox Store - persists guest user changes to localStorage only.
 * Firestore is NEVER touched for non-master-admin users.
 */

type SandboxCollection = 'movies' | 'theaters' | 'actors' | 'showtimes' | 'rooms' | 'combos' | 'promotions' | 'pricing' | 'bookings';

function key(collection: SandboxCollection): string {
  return `${SANDBOX_KEY_PREFIX}${collection}`;
}

function deletedKey(collection: SandboxCollection): string {
  return `${SANDBOX_KEY_PREFIX}deleted_${collection}`;
}

/** Read all overrides for a collection from localStorage */
export function sandboxGetOverrides(collection: SandboxCollection): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key(collection));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Read deleted IDs for a collection */
export function sandboxGetDeleted(collection: SandboxCollection): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(deletedKey(collection));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Save or update a document (guest mode) */
export function sandboxUpsert(collection: SandboxCollection, id: string, data: any): void {
  if (typeof window === 'undefined') return;
  const overrides = sandboxGetOverrides(collection);
  overrides[id] = { ...data, id, _sandboxModified: new Date().toISOString() };
  localStorage.setItem(key(collection), JSON.stringify(overrides));
  // Remove from deleted list if re-added
  const deleted = sandboxGetDeleted(collection);
  deleted.delete(id);
  localStorage.setItem(deletedKey(collection), JSON.stringify([...deleted]));
}

/** Mark a document as deleted (guest mode) */
export function sandboxDelete(collection: SandboxCollection, id: string): void {
  if (typeof window === 'undefined') return;
  const deleted = sandboxGetDeleted(collection);
  deleted.add(id);
  localStorage.setItem(deletedKey(collection), JSON.stringify([...deleted]));
  // Also remove from overrides if present
  const overrides = sandboxGetOverrides(collection);
  delete overrides[id];
  localStorage.setItem(key(collection), JSON.stringify(overrides));
}

/**
 * Merge base data (from Firestore or backup) with sandbox overrides.
 * Returns the final array as the user should see it on their machine.
 */
export function sandboxMerge<T extends { id: string }>(
  collection: SandboxCollection,
  baseDocs: T[]
): T[] {
  if (typeof window === 'undefined') return baseDocs;
  const overrides = sandboxGetOverrides(collection);
  const deleted = sandboxGetDeleted(collection);

  // Apply overrides to existing docs
  const merged = baseDocs
    .filter(doc => !deleted.has(doc.id))
    .map(doc => overrides[doc.id] ? { ...doc, ...overrides[doc.id] } : doc);

  // Add new sandbox-only docs (id starts with 'sandbox_')
  const sandboxOnlyIds = Object.keys(overrides).filter(
    id => id.startsWith('sandbox_') && !baseDocs.find(d => d.id === id)
  );
  for (const id of sandboxOnlyIds) {
    if (!deleted.has(id)) merged.push(overrides[id] as T);
  }

  return merged;
}

/** Clear ALL sandbox data (reset to base state) */
export function sandboxReset(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(SANDBOX_KEY_PREFIX)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

/** Check if there are any unsaved sandbox changes */
export function sandboxHasChanges(): boolean {
  if (typeof window === 'undefined') return false;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(SANDBOX_KEY_PREFIX)) return true;
  }
  return false;
}

/** Generate a new sandbox document ID */
export function sandboxNewId(): string {
  return `sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
