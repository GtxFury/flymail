import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isAdmin: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    req.user = { id: user.id, email: user.email, isAdmin: user.isAdmin };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
