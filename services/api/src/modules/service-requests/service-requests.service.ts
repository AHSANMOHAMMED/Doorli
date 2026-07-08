import { prisma, ServiceRequestStatus } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateServiceRequestInput } from './service-requests.schema.js';

export async function createServiceRequest(userId: string, input: CreateServiceRequestInput) {
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      customerId: userId,
      serviceType: input.serviceType,
      title: input.title,
      description: input.description,
      addressLine: input.addressLine,
      latitude: input.latitude,
      longitude: input.longitude,
      isUrgent: input.isUrgent,
      offeredRate: input.offeredRate,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      status: ServiceRequestStatus.open,
    },
    include: {
      customer: true,
    },
  });

  // Emit notification to nearby providers
  // TODO: Implement Socket.io event emission for provider matching

  return serviceRequest;
}

export async function getServiceRequestById(requestId: string, userId: string, userRole: string) {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      customer: true,
      assignedProvider: true,
    },
  });

  if (!serviceRequest) {
    throw new AppError(404, 'Service request not found');
  }

  // Check access permissions
  if (userRole === 'customer' && serviceRequest.customerId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  if (userRole === 'vendor' && serviceRequest.assignedProviderId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  return serviceRequest;
}

export async function getNearbyServiceRequests(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) {
  // Find service requests within radius (simplified - in production use PostGIS)
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: {
      status: ServiceRequestStatus.open,
      assignedProviderId: null,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      customer: true,
    },
  });

  // Filter by distance (simplified - use PostGIS ST_DistanceSphere in production)
  const nearby = serviceRequests.filter((req) => {
    if (!req.latitude || !req.longitude) return false;
    const distance = calculateDistance(
      latitude,
      longitude,
      Number(req.latitude),
      Number(req.longitude)
    );
    return distance <= radiusKm;
  });

  return nearby;
}

export async function getMyServiceRequests(userId: string, userRole: string) {
  if (userRole === 'customer') {
    return prisma.serviceRequest.findMany({
      where: { customerId: userId },
      include: {
        assignedProvider: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (userRole === 'vendor') {
    return prisma.serviceRequest.findMany({
      where: { assignedProviderId: userId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  throw new AppError(403, 'Access denied');
}

export async function acceptServiceRequest(requestId: string, providerId: string) {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
  });

  if (!serviceRequest) {
    throw new AppError(404, 'Service request not found');
  }

  if (serviceRequest.status !== ServiceRequestStatus.open) {
    throw new AppError(400, 'Service request is no longer available');
  }

  if (serviceRequest.assignedProviderId) {
    throw new AppError(400, 'Service request already assigned');
  }

  const updated = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      assignedProviderId: providerId,
      status: ServiceRequestStatus.assigned,
    },
    include: {
      customer: true,
      assignedProvider: true,
    },
  });

  // Emit notification to customer
  // TODO: Implement Socket.io event emission

  return updated;
}

export async function completeServiceRequest(requestId: string, providerId: string) {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
  });

  if (!serviceRequest) {
    throw new AppError(404, 'Service request not found');
  }

  if (serviceRequest.assignedProviderId !== providerId) {
    throw new AppError(403, 'Access denied');
  }

  if (serviceRequest.status === ServiceRequestStatus.completed) {
    throw new AppError(400, 'Service request already completed');
  }

  const updated = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: ServiceRequestStatus.completed,
    },
    include: {
      customer: true,
      assignedProvider: true,
    },
  });

  // Emit notification to customer
  // TODO: Implement Socket.io event emission

  return updated;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
