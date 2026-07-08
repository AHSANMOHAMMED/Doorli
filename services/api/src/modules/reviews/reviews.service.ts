import { prisma } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateReviewInput } from './reviews.schema.js';

export async function createReview(userId: string, input: CreateReviewInput) {
  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({
    where: { id: input.vendorId },
  });

  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
  }

  // Check if order exists and belongs to user (if orderId provided)
  if (input.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.customerId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Check if review already exists for this order
    const existingReview = await prisma.review.findFirst({
      where: { orderId: input.orderId },
    });

    if (existingReview) {
      throw new AppError(400, 'Review already exists for this order');
    }
  }

  // Check if user already reviewed this vendor (if no orderId)
  if (!input.orderId) {
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: userId,
        vendorId: input.vendorId,
        orderId: null,
      },
    });

    if (existingReview) {
      throw new AppError(400, 'You have already reviewed this vendor');
    }
  }

  const review = await prisma.review.create({
    data: {
      reviewerId: userId,
      vendorId: input.vendorId,
      orderId: input.orderId,
      rating: input.rating,
      comment: input.comment,
      photos: input.photos,
    },
    include: {
      reviewer: true,
      vendor: true,
      order: true,
    },
  });

  // Update vendor rating
  await updateVendorRating(input.vendorId);

  return review;
}

export async function getVendorReviews(vendorId: string) {
  return prisma.review.findMany({
    where: { vendorId },
    include: {
      reviewer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteReview(reviewId: string, userId: string, userRole: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  // Check access permissions
  if (userRole === 'customer' && review.reviewerId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  if (userRole !== 'customer' && userRole !== 'admin') {
    throw new AppError(403, 'Access denied');
  }

  const vendorId = review.vendorId;

  await prisma.review.delete({
    where: { id: reviewId },
  });

  // Update vendor rating
  await updateVendorRating(vendorId);

  return { message: 'Review deleted successfully' };
}

async function updateVendorRating(vendorId: string) {
  const reviews = await prisma.review.findMany({
    where: { vendorId },
  });

  if (reviews.length === 0) {
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        avgRating: 0,
        totalReviews: 0,
      },
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = totalRating / reviews.length;

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      avgRating: avgRating,
      totalReviews: reviews.length,
    },
  });
}
