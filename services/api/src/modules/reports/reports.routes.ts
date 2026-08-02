import { Router } from 'express';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const reportsRouter = Router();
reportsRouter.use(authenticateToken);

function requireAdmin(req: { user?: { role?: string } }) {
  if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
}

function getDateRange(period?: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  return { start, end };
}

reportsRouter.get('/revenue', async (req, res, next) => {
  try {
    requireAdmin(req);
    const period = typeof req.query.period === 'string' ? req.query.period : 'month';
    const { start, end } = getDateRange(period);

    const [revenue, orderCount, avgOrder] = await Promise.all([
      prisma.order.aggregate({
        where: {
          paymentStatus: 'paid',
          createdAt: { gte: start, lte: end },
        },
        _sum: { totalAmount: true, deliveryFee: true },
        _count: true,
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'paid',
          createdAt: { gte: start, lte: end },
        },
        _avg: { totalAmount: true },
      }),
    ]);

    const cancelledCount = await prisma.order.count({
      where: {
        status: 'cancelled',
        createdAt: { gte: start, lte: end },
      },
    });

    const paidRevenue = Number(revenue._sum.totalAmount ?? 0);
    const deliveryRevenue = Number(revenue._sum.deliveryFee ?? 0);
    const totalRevenue = paidRevenue + deliveryRevenue;

    res.json({
      success: true,
      data: {
        period,
        totalRevenue,
        paidRevenue,
        deliveryRevenue,
        totalOrders: orderCount,
        paidOrders: revenue._count,
        cancelledOrders: cancelledCount,
        avgOrderValue: Number(avgOrder._avg.totalAmount ?? 0),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/revenue/export', async (req, res, next) => {
  try {
    requireAdmin(req);
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const period = typeof req.query.period === 'string' ? req.query.period : 'month';
    const { start, end } = getDateRange(period);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        vendor: { select: { businessName: true } },
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const rows = orders.map((o) => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      subtotal: Number(o.subtotal),
      deliveryFee: Number(o.deliveryFee),
      totalAmount: Number(o.totalAmount),
      paymentMethod: o.paymentMethod,
      vendor: o.vendor.businessName,
      customer: o.customer.fullName,
      createdAt: o.createdAt.toISOString(),
    }));

    if (format === 'csv') {
      const headers = [
        'Order ID', 'Order Number', 'Status', 'Payment Status',
        'Subtotal', 'Delivery Fee', 'Total Amount', 'Payment Method',
        'Vendor', 'Customer', 'Created At',
      ];
      const csvLines = [
        headers.join(','),
        ...rows.map((r) =>
          [
            r.orderId,
            r.orderNumber,
            r.status,
            r.paymentStatus,
            r.subtotal,
            r.deliveryFee,
            r.totalAmount,
            r.paymentMethod,
            `"${r.vendor.replace(/"/g, '""')}"`,
            `"${r.customer.replace(/"/g, '""')}"`,
            r.createdAt,
          ].join(',')
        ),
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="revenue-${period}-${Date.now()}.csv"`);
      res.send(csvLines.join('\n'));
    } else {
      res.json({
        success: true,
        data: {
          period,
          exportedAt: new Date().toISOString(),
          totalRecords: rows.length,
          items: rows,
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/orders', async (req, res, next) => {
  try {
    requireAdmin(req);
    const period = typeof req.query.period === 'string' ? req.query.period : 'month';
    const { start, end } = getDateRange(period);

    const [statusCounts, typeCounts, recentOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      prisma.order.groupBy({
        by: ['orderType'],
        where: { createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { vendor: { select: { businessName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const byStatus = statusCounts.map((s) => ({
      status: s.status,
      count: s._count,
    }));

    const byType = typeCounts.map((t) => ({
      type: t.orderType,
      count: t._count,
    }));

    res.json({
      success: true,
      data: { period, byStatus, byType, recentOrders },
    });
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/vendors', async (req, res, next) => {
  try {
    requireAdmin(req);
    const period = typeof req.query.period === 'string' ? req.query.period : 'month';
    const { start, end } = getDateRange(period);

    const topVendors = await prisma.order.groupBy({
      by: ['vendorId'],
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: 'paid',
      },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    });

    const vendorIds = topVendors.map((v) => v.vendorId);
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, businessName: true, category: true, avgRating: true },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    const result = topVendors.map((v) => ({
      ...vendorMap.get(v.vendorId),
      totalRevenue: Number(v._sum.totalAmount ?? 0),
      orderCount: v._count,
    }));

    res.json({ success: true, data: { period, vendors: result } });
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/drivers', async (req, res, next) => {
  try {
    requireAdmin(req);
    const period = typeof req.query.period === 'string' ? req.query.period : 'month';
    const { start, end } = getDateRange(period);

    const topDrivers = await prisma.order.groupBy({
      by: ['driverId'],
      where: {
        createdAt: { gte: start, lte: end },
        driverId: { not: null },
        status: 'delivered',
      },
      _count: true,
      _sum: { deliveryFee: true },
      orderBy: { _count: { driverId: 'desc' } },
      take: 10,
    });

    const driverIds = topDrivers.map((d) => d.driverId as string);
    const drivers = await prisma.driver.findMany({
      where: { userId: { in: driverIds } },
      include: { user: { select: { fullName: true, phone: true } } },
    });

    const driverMap = new Map(drivers.map((d) => [d.userId, d]));

    const result = topDrivers.map((d) => ({
      userId: d.driverId,
      ...driverMap.get(d.driverId as string),
      deliveries: d._count,
      totalDeliveryFees: Number(d._sum.deliveryFee ?? 0),
    }));

    res.json({ success: true, data: { period, drivers: result } });
  } catch (err) {
    next(err);
  }
});

export default reportsRouter;
