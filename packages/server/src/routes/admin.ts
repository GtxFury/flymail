import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// Get all users
adminRouter.get('/users', async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { domains: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
adminRouter.post('/users', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      name: z.string().optional(),
      isAdmin: z.boolean().optional(),
    });

    const { email, password, name, isAdmin } = schema.parse(req.body);

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
        isAdmin: isAdmin || false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Update user
adminRouter.patch('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      isAdmin: z.boolean().optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    });

    const data = schema.parse(req.body);
    const userId = req.params.id;

    // Prevent admin from disabling themselves
    if (userId === req.user!.id && data.isActive === false) {
      throw new AppError(400, 'Cannot disable your own account');
    }

    // Prevent admin from removing their own admin status
    if (userId === req.user!.id && data.isAdmin === false) {
      throw new AppError(400, 'Cannot remove your own admin status');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Delete user
adminRouter.delete('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      throw new AppError(400, 'Cannot delete your own account');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get settings
adminRouter.get('/settings', async (req: AuthRequest, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'global', allowPublicRegister: true },
      });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update settings
adminRouter.patch('/settings', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      allowPublicRegister: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    });

    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Get system stats
adminRouter.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const [userCount, domainCount, addressCount, emailCount] = await Promise.all([
      prisma.user.count(),
      prisma.domain.count(),
      prisma.address.count(),
      prisma.email.count(),
    ]);

    res.json({
      users: userCount,
      domains: domainCount,
      addresses: addressCount,
      emails: emailCount,
    });
  } catch (error) {
    next(error);
  }
});
