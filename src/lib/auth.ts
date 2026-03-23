import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { SessionPayload, UserRole } from '@/types/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bublinky-dev-secret-change-me'
);

const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createSession(
  userId: string,
  role: UserRole,
  name: string
): Promise<string> {
  const token = await new SignJWT({ user_id: userId, role, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Rate limiting: in-memory store (resets on server restart, good enough for 2 users)
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  cooldownSeconds: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, cooldownSeconds: 0 };
  }

  if (record.blockedUntil > now) {
    const cooldownSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, cooldownSeconds };
  }

  // Reset if cooldown expired
  if (record.blockedUntil <= now && record.count >= MAX_ATTEMPTS) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, cooldownSeconds: 0 };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
    cooldownSeconds: 0,
  };
}

export function recordLoginAttempt(identifier: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const record = loginAttempts.get(identifier) || { count: 0, blockedUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = Date.now() + COOLDOWN_MS;
  }

  loginAttempts.set(identifier, record);
}
