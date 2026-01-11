import { Router } from 'express';
import { z } from 'zod';
import dns from 'dns';
import { promisify } from 'util';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

const resolveMx = promisify(dns.resolveMx);

export const domainsRouter = Router();
domainsRouter.use(authMiddleware);

const createDomainSchema = z.object({
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
});

// Get all domains for user
domainsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const domains = await prisma.domain.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: { select: { addresses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(domains);
  } catch (error) {
    next(error);
  }
});

// Get single domain
domainsRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        addresses: {
          include: {
            _count: { select: { emails: true } },
          },
        },
      },
    });

    if (!domain) {
      throw new AppError(404, 'Domain not found');
    }

    res.json(domain);
  } catch (error) {
    next(error);
  }
});

// Create domain
domainsRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { domain } = createDomainSchema.parse(req.body);
    const normalizedDomain = domain.toLowerCase();

    const existing = await prisma.domain.findUnique({
      where: { domain: normalizedDomain },
    });

    if (existing) {
      throw new AppError(400, 'Domain already registered');
    }

    const newDomain = await prisma.domain.create({
      data: {
        domain: normalizedDomain,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      ...newDomain,
      mxRecord: {
        type: 'MX',
        host: '@',
        value: process.env.MX_HOSTNAME || 'mail.flymail.local',
        priority: 10,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Verify domain MX record
domainsRouter.post('/:id/verify', async (req: AuthRequest, res, next) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!domain) {
      throw new AppError(404, 'Domain not found');
    }

    const expectedMx = process.env.MX_HOSTNAME || 'mail.flymail.local';

    try {
      const mxRecords = await resolveMx(domain.domain);
      const hasMx = mxRecords.some(
        (record) => record.exchange.toLowerCase() === expectedMx.toLowerCase()
      );

      if (hasMx) {
        await prisma.domain.update({
          where: { id: domain.id },
          data: { mxVerified: true, verified: true },
        });

        res.json({ verified: true, message: 'MX record verified successfully' });
      } else {
        res.json({
          verified: false,
          message: 'MX record not found',
          found: mxRecords.map((r) => r.exchange),
          expected: expectedMx,
        });
      }
    } catch {
      res.json({
        verified: false,
        message: 'Could not resolve MX records. Please check your DNS configuration.',
      });
    }
  } catch (error) {
    next(error);
  }
});

// Delete domain
domainsRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!domain) {
      throw new AppError(404, 'Domain not found');
    }

    await prisma.domain.delete({ where: { id: domain.id } });

    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    next(error);
  }
});
