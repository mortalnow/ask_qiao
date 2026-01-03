#!/usr/bin/env node

import db from '../server/db/init.js';

console.log('\n🎟️  Invite Code Usage Report\n');

// Get all invite codes with user info
const codes = db.prepare(`
  SELECT 
    ic.code,
    ic.created_at as code_created,
    ic.used_at,
    u.username,
    u.created_at as user_created
  FROM invite_codes ic
  LEFT JOIN users u ON ic.used_by = u.id
  ORDER BY ic.created_at DESC
`).all();

if (codes.length === 0) {
  console.log('No invite codes found.');
  process.exit(0);
}

console.log('All Invite Codes:\n');

codes.forEach((code, index) => {
  const status = code.username ? '✅ USED' : '⏳ UNUSED';
  const usedBy = code.username ? `by ${code.username}` : '';
  const usedAt = code.used_at ? new Date(code.used_at).toLocaleString() : '';
  
  console.log(`${index + 1}. ${code.code} - ${status} ${usedBy}`);
  if (code.username) {
    console.log(`   User created: ${new Date(code.user_created).toLocaleString()}`);
    console.log(`   Code used at: ${usedAt}`);
  }
  console.log(`   Code created: ${new Date(code.code_created).toLocaleString()}`);
  console.log('');
});

// Summary
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN used_by IS NULL THEN 1 ELSE 0 END) as unused,
    SUM(CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END) as used
  FROM invite_codes
`).get();

console.log(`📊 Summary: ${stats.total} total codes (${stats.unused} unused, ${stats.used} used)\n`);

