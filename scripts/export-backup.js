/**
 * Export all public Firestore collections to public/data/backup-db.json
 * Run: node scripts/export-backup.js
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    let val = rest.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    env[key.trim()] = val;
  }
});

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

/**
 * Wraps a promise with a 3-second timeout.
 */
async function withTimeout(promise, ms = 3000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('RESOURCE_EXHAUSTED: Firestore timeout after ' + ms + 'ms'));
    }, ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Collections to export (public-facing data only)
const COLLECTIONS_TO_EXPORT = [
  'movies',
  'theaters',
  'actors',
  'showtimes',
  'rooms',
  'seats',
  'combos',
  'promotions',
  'pricing',
];

async function exportBackup() {
  console.log('========================================');
  console.log(' Exporting Firestore backup...');
  console.log('========================================');

  const outDir = path.join(process.cwd(), 'public', 'data');
  const outPath = path.join(outDir, 'backup-db.json');

  // Load existing backup to preserve data for skipped collections
  let existingBackup = { collections: {}, dashboardStats: null };
  if (fs.existsSync(outPath)) {
    try {
      existingBackup = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    } catch (e) {
      console.warn('  !! Failed to parse existing backup-db.json');
    }
  }

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    collections: {},
    dashboardStats: existingBackup.dashboardStats || { totalRevenue: 0, totalTickets: 0, totalBookings: 0 }
  };

  let successCount = 0;

  for (const collectionName of COLLECTIONS_TO_EXPORT) {
    try {
      const snap = await withTimeout(db.collection(collectionName).get());
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      backup.collections[collectionName] = docs;
      console.log(`  -> Exported "${collectionName}": ${docs.length} docs`);
      successCount++;
    } catch (err) {
      console.warn(`  !! Skipped "${collectionName}": ${err.message}`);
      // PRESERVE existing data if fetch fails
      const preserved = existingBackup.collections?.[collectionName] || [];
      backup.collections[collectionName] = preserved;
      if (preserved.length > 0) {
        console.log(`     (Preserved ${preserved.length} docs from previous backup)`);
      }
    }
  }

  // Also export aggregate stats (for dashboard demo)
  try {
    const bookingsSnap = await withTimeout(db.collection('bookings').where('status', '==', 'CONFIRMED').get());
    const totalRevenue = bookingsSnap.docs.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
    const totalTickets = bookingsSnap.docs.reduce((s, d) => s + (d.data().seatCount || 1), 0);
    backup.dashboardStats = {
      totalRevenue,
      totalTickets,
      totalBookings: bookingsSnap.size,
    };
    console.log(`  -> Dashboard stats: ${totalRevenue.toLocaleString()}đ revenue, ${totalTickets} tickets`);
  } catch (err) {
    console.warn('  !! Could not export dashboard stats:', err.message);
    // Already defaulted to existingBackup.dashboardStats in object init
    if (existingBackup.dashboardStats) {
      console.log('     (Preserved stats from previous backup)');
    }
  }

  // Save the file
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf-8');

  const finalStats = fs.statSync(outPath);
  const sizeMB = (finalStats.size / 1024 / 1024).toFixed(2);
  
  console.log('');
  console.log(`========================================`);
  console.log(` Backup saved to: public/data/backup-db.json`);
  console.log(` File size: ${sizeMB} MB`);
  console.log(` Exported at: ${backup.exportedAt}`);
  console.log(` Status: ${successCount}/${COLLECTIONS_TO_EXPORT.length} collections updated`);
  console.log(`========================================`);
}

exportBackup().catch(console.error);
