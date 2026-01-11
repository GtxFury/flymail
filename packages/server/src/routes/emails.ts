import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

export const emailsRouter = Router();
emailsRouter.use(authMiddleware);

// Get emails for user (with pagination and filters)
emailsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      addressId: z.string().optional(),
      isRead: z.enum(['true', 'false']).optional(),
      isStarred: z.enum(['true', 'false']).optional(),
      search: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    });

    const { addressId, isRead, isStarred, search, page, limit } = schema.parse(req.query);

    const where: any = {
      address: { domain: { userId: req.user!.id } },
    };

    if (addressId) {
      where.addressId = addressId;
    }
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    if (isStarred !== undefined) {
      where.isStarred = isStarred === 'true';
    }
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { fromAddress: { contains: search } },
        { fromName: { contains: search } },
        { textContent: { contains: search } },
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          address: {
            include: {
              domain: { select: { domain: true } },
            },
          },
          _count: { select: { attachments: true } },
        },
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.email.count({ where }),
    ]);

    const formattedEmails = emails.map((email) => ({
      id: email.id,
      messageId: email.messageId,
      fromAddress: email.fromAddress,
      fromName: email.fromName,
      toAddress: email.toAddress,
      subject: email.subject,
      preview: email.textContent?.substring(0, 150) || '',
      isRead: email.isRead,
      isStarred: email.isStarred,
      receivedAt: email.receivedAt,
      attachmentCount: email._count.attachments,
      address: {
        id: email.address.id,
        localPart: email.address.localPart,
        domain: email.address.domain.domain,
        fullAddress: `${email.address.localPart}@${email.address.domain.domain}`,
      },
    }));

    res.json({
      emails: formattedEmails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Get single email
emailsRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const email = await prisma.email.findFirst({
      where: {
        id: req.params.id,
        address: { domain: { userId: req.user!.id } },
      },
      include: {
        address: {
          include: { domain: { select: { domain: true } } },
        },
        attachments: true,
      },
    });

    if (!email) {
      throw new AppError(404, 'Email not found');
    }

    // Mark as read
    if (!email.isRead) {
      await prisma.email.update({
        where: { id: email.id },
        data: { isRead: true },
      });
    }

    res.json({
      ...email,
      address: {
        id: email.address.id,
        localPart: email.address.localPart,
        domain: email.address.domain.domain,
        fullAddress: `${email.address.localPart}@${email.address.domain.domain}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update email (mark read/starred)
emailsRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      isRead: z.boolean().optional(),
      isStarred: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const email = await prisma.email.findFirst({
      where: {
        id: req.params.id,
        address: { domain: { userId: req.user!.id } },
      },
    });

    if (!email) {
      throw new AppError(404, 'Email not found');
    }

    const updated = await prisma.email.update({
      where: { id: email.id },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Delete email
emailsRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const email = await prisma.email.findFirst({
      where: {
        id: req.params.id,
        address: { domain: { userId: req.user!.id } },
      },
    });

    if (!email) {
      throw new AppError(404, 'Email not found');
    }

    await prisma.email.delete({ where: { id: email.id } });

    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get unread count
emailsRouter.get('/stats/unread', async (req: AuthRequest, res, next) => {
  try {
    const count = await prisma.email.count({
      where: {
        address: { domain: { userId: req.user!.id } },
        isRead: false,
      },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
});
