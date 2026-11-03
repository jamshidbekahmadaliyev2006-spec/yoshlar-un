import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  id: number;
  phone: string;
  role: string;
  name: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}

