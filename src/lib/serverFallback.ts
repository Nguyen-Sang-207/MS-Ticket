import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

let backupCache: any = null;

export function getBackupData(collection: string) {
  if (!backupCache) {
    try {
      const backupPath = path.join(process.cwd(), 'public', 'data', 'backup-db.json');
      const fileContents = fs.readFileSync(backupPath, 'utf8');
      backupCache = JSON.parse(fileContents);
    } catch (error) {
      console.error('Failed to read backup-db.json:', error);
      return [];
    }
  }
  return backupCache.collections?.[collection] || [];
}

// Module-level flag - resets on server restart, persists within same module instance
let isFirebaseDownServer = false;

export function isFirebaseDownOnServer() {
  return isFirebaseDownServer;
}

export function isQuotaError(error: any): boolean {
  const isError =
    error?.message?.includes('RESOURCE_EXHAUSTED') ||
    error?.message?.includes('Quota exceeded') ||
    error?.code === 8 ||
    error?.details?.includes('Quota exceeded');
  if (isError) {
    isFirebaseDownServer = true;
  }
  return isError;
}

export function enforceMasterAdminOnly(request: NextRequest) {
  const isMaster = request.cookies.get('master_admin')?.value === '1';
  if (!isMaster) {
    throw new Error('RESOURCE_EXHAUSTED: Non-master-admin access blocked to save quota. Using fallback data.');
  }
}

/**
 * Wraps a Firebase promise with a 3-second timeout.
 * If Firebase doesn't respond in time, throws an error that
 * triggers the quota/fallback handling logic.
 */
export async function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      isFirebaseDownServer = true;
      reject(new Error('RESOURCE_EXHAUSTED: Firebase timeout after ' + ms + 'ms'));
    }, ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}
