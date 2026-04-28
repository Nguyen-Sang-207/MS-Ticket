/**
 * Master Admin configuration.
 * Only these emails can write to Firestore directly.
 * All other users operate in Sandbox mode (LocalStorage only).
 */
export const MASTER_ADMIN_EMAILS: string[] = [
  'nguyenvanmsang@gmail.com', // Master Admin - only this account can write to Firestore
];

export function isMasterAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/** Key prefix for sandbox data stored in localStorage */
export const SANDBOX_KEY_PREFIX = '__cineme_sandbox__';

/** Current backup data version - bump this when you re-export */
export const BACKUP_VERSION = '1.0';
