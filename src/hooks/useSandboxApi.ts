'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isMasterAdmin } from '@/lib/masterConfig';
import { sandboxUpsert, sandboxDelete, sandboxNewId } from '@/lib/sandboxStore';

type Collection = 'movies' | 'theaters' | 'actors' | 'showtimes' | 'rooms' | 'combos' | 'promotions' | 'pricing';

interface SandboxApiResult {
  success: boolean;
  data?: any;
  sandbox?: boolean; // true if change was saved to localStorage only
  message?: string;
}

/**
 * useSandboxApi - Universal CRUD hook for admin pages.
 *
 * For Master Admin: calls the real API endpoint (Firestore write).
 * For Guest/Demo users: saves changes to localStorage only (Sandbox mode).
 *
 * Usage in admin pages:
 *   const { create, update, remove, isSandboxMode } = useSandboxApi('movies');
 */
export function useSandboxApi(collection: Collection) {
  const { user, firebaseUser } = useAuth();
  const isMaster = isMasterAdmin(user?.email);
  const isSandboxMode = !isMaster;

  /** Get auth token for real API calls */
  const getToken = useCallback(async (): Promise<string> => {
    if (!firebaseUser) throw new Error('Not authenticated');
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  /**
   * CREATE a new document.
   * Master: POST to API → Firestore
   * Guest: Saves to sandbox with generated ID
   */
  const create = useCallback(async (
    data: Record<string, any>,
    apiEndpoint?: string,
    formData?: FormData
  ): Promise<SandboxApiResult> => {
    if (isMaster) {
      try {
        const token = await getToken();
        const endpoint = apiEndpoint || `/api/${collection}`;
        const body = formData || JSON.stringify(data);
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        if (!formData) headers['Content-Type'] = 'application/json';

        const res = await fetch(endpoint, { method: 'POST', headers, body });
        const json = await res.json();
        return { success: res.ok, data: json.data, message: json.message };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    } else {
      // Sandbox mode: save locally
      const id = sandboxNewId();
      const doc = { ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      sandboxUpsert(collection, id, doc);
      return { success: true, data: doc, sandbox: true, message: 'Saved locally (sandbox mode)' };
    }
  }, [isMaster, collection, getToken]);

  /**
   * UPDATE an existing document.
   * Master: PUT/PATCH to API → Firestore
   * Guest: Merges into sandbox
   */
  const update = useCallback(async (
    id: string,
    data: Record<string, any>,
    apiEndpoint?: string,
    formData?: FormData
  ): Promise<SandboxApiResult> => {
    if (isMaster) {
      try {
        const token = await getToken();
        const endpoint = apiEndpoint || `/api/${collection}/${id}`;
        const body = formData || JSON.stringify(data);
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        if (!formData) headers['Content-Type'] = 'application/json';

        const res = await fetch(endpoint, { method: 'PUT', headers, body });
        const json = await res.json();
        return { success: res.ok, data: json.data, message: json.message };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    } else {
      sandboxUpsert(collection, id, { ...data, updatedAt: new Date().toISOString() });
      return { success: true, data: { id, ...data }, sandbox: true, message: 'Saved locally (sandbox mode)' };
    }
  }, [isMaster, collection, getToken]);

  /**
   * DELETE a document.
   * Master: DELETE to API → Firestore
   * Guest: Marks as deleted in sandbox (hidden locally)
   */
  const remove = useCallback(async (
    id: string,
    apiEndpoint?: string
  ): Promise<SandboxApiResult> => {
    if (isMaster) {
      try {
        const token = await getToken();
        const endpoint = apiEndpoint || `/api/${collection}/${id}`;
        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        return { success: res.ok, message: json.message };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    } else {
      sandboxDelete(collection, id);
      return { success: true, sandbox: true, message: 'Hidden locally (sandbox mode)' };
    }
  }, [isMaster, collection, getToken]);

  return { create, update, remove, isSandboxMode, isMaster };
}
