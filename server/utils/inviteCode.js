import crypto from 'crypto';

/**
 * Generate a secure random invite code in format: ABC123-XYZ789
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I, O, 0, 1
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  
  code += '-';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Validate invite code format
 */
export function isValidCodeFormat(code) {
  return /^[A-Z0-9]{6}-[A-Z0-9]{6}$/.test(code);
}

