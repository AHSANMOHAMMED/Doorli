import express from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = express.Router();

// Schema for hotel creation
const createHotelSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.literal('hotel'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string(),
  address: z.string().optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number'),
  pricePerNight: z.number().positive('Price must be positive'),
  rating: z.number().min(1).max(5).optional(),
  totalRooms: z.number().int().min(1, 'Must have at least 1 room'),
  availableRooms: z.number().int().min(0, 'Available rooms cannot be negative'),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  ownerUserId: z.string().uuid().optional(),
  roomType: z.string().min(2).max(100).default('Standard Room'),
  roomCapacity: z.number().int().positive().max(20).default(2),
});

router.post('/', authenticateToken, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const validatedData = createHotelSchema.parse(req.body);
    if (!req.user) return next(new AppError(401, 'Authentication required'));
    const ownerUserId = req.user.role === 'admin' && validatedData.ownerUserId
      ? validatedData.ownerUserId
      : req.user.id;

    const hotel = await prisma.$transaction(async (tx) => {
      const existingVendor = await tx.vendor.findUnique({ where: { userId: ownerUserId } });
      if (existingVendor && existingVendor.category !== 'hotel') {
        throw new AppError(409, 'This account already owns a non-hotel vendor');
      }
      const vendor = existingVendor
        ? await tx.vendor.update({
            where: { id: existingVendor.id },
            data: {
              businessName: validatedData.businessName,
              description: validatedData.description,
              phone: validatedData.phone,
              addressLine: validatedData.address,
              city: validatedData.city,
              ...(validatedData.rating === undefined ? {} : { avgRating: validatedData.rating }),
            },
          })
        : await tx.vendor.create({
            data: {
              userId: ownerUserId,
              businessName: validatedData.businessName,
              category: 'hotel',
              description: validatedData.description,
              phone: validatedData.phone,
              addressLine: validatedData.address,
              city: validatedData.city,
              avgRating: validatedData.rating ?? 0,
            },
          });

      const room = await tx.hotelRoom.upsert({
        where: { vendorId_roomType: { vendorId: vendor.id, roomType: validatedData.roomType } },
        create: {
          vendorId: vendor.id,
          roomType: validatedData.roomType,
          capacity: validatedData.roomCapacity,
          totalRooms: validatedData.totalRooms,
          price: validatedData.pricePerNight,
          amenities: validatedData.amenities ?? [],
        },
        update: {
          capacity: validatedData.roomCapacity,
          totalRooms: validatedData.totalRooms,
          price: validatedData.pricePerNight,
          amenities: validatedData.amenities ?? [],
          isActive: true,
        },
      });

      return { vendor, room };
    });

    res.status(201).json({
      success: true,
      data: {
        ...hotel.vendor,
        hotelRooms: [hotel.room],
      },
      message: 'Hotel created successfully',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
});

export default router;
