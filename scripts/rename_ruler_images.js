/**
 * Script to rename ruler images to match expected format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULERS_DIR = path.join(__dirname, '..', 'assets', 'images', 'rulers');

// Mapping of current filenames to expected IDs
const renameMap = {
  'Peter_1.jpg': 'peter1.jpg',
  'Catherine_1.jpg': 'catherine1.jpg',
  'Peter_2.jpg': 'peter2.jpg',
  'Anna_Ioannovna.jpg': 'anna.jpg',
  'Ivan_VI.jpg': 'ivan6.jpg',
  'Elisabeth_Petrovna.jpg': 'elizabeth.jpg',
  'Peter_III.webp': 'peter3.jpg', // Will need manual conversion
  'Catherine_II.webp': 'catherine2.jpg', // Will need manual conversion
  'Pavel_1.jpg': 'paul1.jpg',
  'Alexander_I.jpg': 'alexander1.jpg',
  'Nicholas_I.jpg': 'nicholas1.jpg',
  'Alexander_II.jpg': 'alexander2.jpg',
  'Alexander_III.jpg': 'alexander3.jpg',
  'Nicholas_2.jpg': 'nicholas2.jpg',
};

console.log('🔄 Renaming ruler images...\n');

let renamed = 0;
let errors = 0;

for (const [oldName, newName] of Object.entries(renameMap)) {
  const oldPath = path.join(RULERS_DIR, oldName);
  const newPath = path.join(RULERS_DIR, newName);

  if (!fs.existsSync(oldPath)) {
    console.log(`⏭️  Skipped: ${oldName} (file not found)`);
    continue;
  }

  if (fs.existsSync(newPath)) {
    console.log(`⏭️  Skipped: ${oldName} → ${newName} (target already exists)`);
    continue;
  }

  try {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Renamed: ${oldName} → ${newName}`);
    renamed++;
  } catch (error) {
    console.error(`❌ Error: ${oldName} - ${error.message}`);
    errors++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Renamed: ${renamed}`);
console.log(`   Errors: ${errors}`);

// Check for webp files that need conversion
const webpFiles = fs.readdirSync(RULERS_DIR).filter(f => f.endsWith('.webp'));
if (webpFiles.length > 0) {
  console.log(`\n⚠️  Warning: ${webpFiles.length} WebP files need conversion:`);
  webpFiles.forEach(f => console.log(`   - ${f}`));
  console.log('\n💡 Convert WebP to JPG:');
  console.log('   Option 1: Use online converter (https://convertio.co/webp-jpg/)');
  console.log('   Option 2: Use ImageMagick: convert file.webp file.jpg');
}

console.log('\n✨ Done!');
