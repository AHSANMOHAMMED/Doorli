import { Router } from 'express';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';

/**
 * Simple recommendation engine based on order history + popular vendors.
 * Upgrade path: wire services/ai for LLM-ranked feeds.
 */
const recommendationsRouter = Router();

recommendationsRouter.get('/feed', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const pastOrders = await prisma.order.findMany({
      where: { customerId: userId, status: 'delivered' },
      select: { vendorId: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    const pastVendorIds = [...new Set(pastOrders.map((o) => o.vendorId))];

    const [fromHistory, popular, topRated] = await Promise.all([
      pastVendorIds.length
        ? prisma.vendor.findMany({
            where: { id: { in: pastVendorIds }, isOpen: true },
            take: 6,
          })
        : Promise.resolve([]),
      prisma.vendor.findMany({
        where: { isOpen: true, isVerified: true },
        orderBy: { totalReviews: 'desc' },
        take: 8,
      }),
      prisma.vendor.findMany({
        where: { isOpen: true, avgRating: { gte: 4 } },
        orderBy: { avgRating: 'desc' },
        take: 8,
      }),
    ]);

    const seen = new Set<string>();
    const feed = [...fromHistory, ...popular, ...topRated].filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    res.json({
      success: true,
      data: {
        items: feed.slice(0, 20),
        strategy: pastVendorIds.length ? 'history+popular' : 'popular+rated',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default recommendationsRouter;
