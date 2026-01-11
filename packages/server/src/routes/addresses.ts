import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

export const addressesRouter = Router();
addressesRouter.use(authMiddleware);

const createAddressSchema = z.object({
  localPart: z
    .string()
    .regex(/^[a-zA-Z0-9._+-]+$/, 'Invalid address format')
    .or(z.literal('*')), // * for catch-all
  domainId: z.string(),
});

// Get all addresses for user
addressesRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: {
        domain: { userId: req.user!.id },
      },
      include: {
        domain: { select: { domain: true } },
        _count: { select: { emails: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedAddresses = addresses.map((addr) => ({
      ...addr,
      fullAddress: addr.catchAll
        ? `*@${addr.domain.domain}`
        : `${addr.localPart}@${addr.domain.domain}`,
    }));

    res.json(formattedAddresses);
  } catch (error) {
    next(error);
  }
});

// Get addresses by domain
addressesRouter.get('/domain/:domainId', async (req: AuthRequest, res, next) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: {
        id: req.params.domainId,
        userId: req.user!.id,
      },
    });

    if (!domain) {
      throw new AppError(404, 'Domain not found');
    }

    const addresses = await prisma.address.findMany({
      where: { domainId: domain.id },
      include: {
        domain: { select: { domain: true } },
        _count: { select: { emails: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(addresses);
  } catch (error) {
    next(error);
  }
});

// Create address
addressesRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { localPart, domainId } = createAddressSchema.parse(req.body);

    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: req.user!.id,
      },
    });

    if (!domain) {
      throw new AppError(404, 'Domain not found');
    }

    const isCatchAll = localPart === '*';
    const normalizedLocalPart = localPart.toLowerCase();

    // Check for existing address
    const existing = await prisma.address.findFirst({
      where: {
        localPart: normalizedLocalPart,
        domainId,
      },
    });

    if (existing) {
      throw new AppError(400, 'Address already exists');
    }

    // Check if catch-all already exists for this domain
    if (isCatchAll) {
      const existingCatchAll = await prisma.address.findFirst({
        where: { domainId, catchAll: true },
      });
      if (existingCatchAll) {
        throw new AppError(400, 'Catch-all address already exists for this domain');
      }
    }

    const address = await prisma.address.create({
      data: {
        localPart: normalizedLocalPart,
        catchAll: isCatchAll,
        domainId,
      },
      include: {
        domain: { select: { domain: true } },
      },
    });

    res.status(201).json({
      ...address,
      fullAddress: isCatchAll
        ? `*@${address.domain.domain}`
        : `${address.localPart}@${address.domain.domain}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// Delete address
addressesRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const address = await prisma.address.findFirst({
      where: {
        id: req.params.id,
        domain: { userId: req.user!.id },
      },
    });

    if (!address) {
      throw new AppError(404, 'Address not found');
    }

    await prisma.address.delete({ where: { id: address.id } });

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
});
