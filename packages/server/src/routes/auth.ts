import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string(),
});

// Helper to get or create settings
async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 'global', allowPublicRegister: true },
    });
  }
  return settings;
}

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if this is the first user (will become admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // If not first user, check if registration is allowed
    if (!isFirstUser) {
      const settings = await getSettings();
      if (!settings.allowPublicRegister) {
        throw new AppError(403, 'Registration is disabled');
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isAdmin: isFirstUser, // First user becomes admin
      },
      select: { id: true, email: true, name: true, isAdmin: true, createdAt: true },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is disabled');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Get current user
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: { domains: true },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update password
authRouter.put('/password', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError(400, 'Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});
