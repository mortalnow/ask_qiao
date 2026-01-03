#!/usr/bin/env node

import db from '../server/db/init.js';
import { generateInviteCode } from '../server/utils/inviteCode.js';

const args = process.argv.slice(2);
const count = parseInt(args[0]) || 1;

console.log(`\n🎟️  Generating ${count} invite code(s)...\n`);

const codes = [];

for (let i = 0; i < count; i++) {
  let code;
  let attempts = 0;
  
  // Ensure unique code
  while (attempts < 10) {
    code = generateInviteCode();
    const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(code);
    if (!existing) break;
    attempts++;
  }
  
  if (attempts >= 10) {
    console.error('Failed to generate unique code after 10 attempts');
    process.exit(1);
  }
  
  db.prepare('INSERT INTO invite_codes (code) VALUES (?)').run(code);
  codes.push(code);
  console.log(`  ✅ ${code}`);
}

console.log(`\n📋 Generated ${codes.length} invite code(s)`);
console.log('Share these codes with users to grant access.\n');

// Show stats
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN used_by IS NULL THEN 1 ELSE 0 END) as unused,
    SUM(CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END) as used
  FROM invite_codes
`).get();

console.log(`📊 Total codes: ${stats.total} (${stats.unused} unused, ${stats.used} used)\n`);

