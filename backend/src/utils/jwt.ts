import crypto from 'crypto';
import { UserRole } from '../models';

export interface JwtPayload {
  sub: string;
  uid: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  exp: number;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required for Paperloop authentication');
  }
  return secret;
}

export function signJwt(payload: Omit<JwtPayload, 'exp'>, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }));
  const signature = crypto.createHmac('sha256', getSecret()).update(`${header}.${body}`).digest();
  return `${header}.${body}.${base64url(signature)}`;
}

export function verifyJwt(token: string): JwtPayload {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) throw new Error('Malformed token');

  const expected = base64url(crypto.createHmac('sha256', getSecret()).update(`${header}.${body}`).digest());
  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actual.length !== expectedBuffer.length || !crypto.timingSafeEqual(actual, expectedBuffer)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(decodeBase64url(body)) as JwtPayload;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}
