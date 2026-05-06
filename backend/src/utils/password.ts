import crypto from 'crypto';

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored?: string) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, KEY_LENGTH);
  const storedHash = Buffer.from(hash, 'hex');
  return storedHash.length === candidate.length && crypto.timingSafeEqual(storedHash, candidate);
}
