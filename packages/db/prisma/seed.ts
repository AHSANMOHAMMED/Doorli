import { PrismaClient, UserRole, VendorCategory, VehicleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Doorli123!';

async function main() {
  console.log('Seeding Doorli database...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const customer = await prisma.user.upsert({
    where: { phone: '+94771234567' },
    update: {
      email: 'customer@doorli.test',
      username: 'customer',
      passwordHash,
      isVerified: true,
    },
    create: {
      fullName: 'Test Customer',
      phone: '+94771234567',
      email: 'customer@doorli.test',
      username: 'customer',
      passwordHash,
      role: UserRole.customer,
      isVerified: true,
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { phone: '+94771234568' },
    update: {
      email: 'vendor@doorli.test',
      username: 'vendor',
      passwordHash,
      isVerified: true,
    },
    create: {
      fullName: 'Test Vendor Owner',
      phone: '+94771234568',
      email: 'vendor@doorli.test',
      username: 'vendor',
      passwordHash,
      role: UserRole.vendor,
      isVerified: true,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { phone: '+94771234569' },
    update: {},
    create: {
      fullName: 'Test Driver',
      phone: '+94771234569',
      email: 'driver@doorli.test',
      role: UserRole.driver,
      isVerified: true,
    },
  });

  await prisma.address.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      userId: customer.id,
      label: 'Home',
      addressLine: '123 Main Street, Colombo 03',
      city: 'Colombo',
      latitude: 6.9271,
      longitude: 79.8612,
      isDefault: true,
    },
  });

  const groceryVendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      businessName: 'Corner Grocery',
      category: VendorCategory.grocery,
      description: 'Fresh groceries and daily essentials',
      addressLine: '45 Galle Road, Colombo 03',
      city: 'Colombo',
      latitude: 6.9265,
      longitude: 79.8600,
      isOpen: true,
      isVerified: true,
      deliveryRadiusKm: 5,
      minOrderAmount: 500,
      openingHours: {
        mon: { open: '08:00', close: '22:00' },
        tue: { open: '08:00', close: '22:00' },
        wed: { open: '08:00', close: '22:00' },
        thu: { open: '08:00', close: '22:00' },
        fri: { open: '08:00', close: '22:00' },
        sat: { open: '08:00', close: '22:00' },
        sun: { open: '09:00', close: '20:00' },
      },
    },
  });

  const restaurantVendorUser = await prisma.user.upsert({
    where: { phone: '+94771234570' },
    update: {
      email: 'restaurant@doorli.test',
      username: 'spicekitchen',
      passwordHash,
      isVerified: true,
    },
    create: {
      fullName: 'Restaurant Owner',
      phone: '+94771234570',
      email: 'restaurant@doorli.test',
      username: 'spicekitchen',
      passwordHash,
      role: UserRole.vendor,
      isVerified: true,
    },
  });

  const restaurantVendor = await prisma.vendor.upsert({
    where: { userId: restaurantVendorUser.id },
    update: {},
    create: {
      userId: restaurantVendorUser.id,
      businessName: 'Spice Kitchen',
      category: VendorCategory.restaurant,
      description: 'Authentic Sri Lankan cuisine',
      addressLine: '78 Duplication Road, Colombo 04',
      city: 'Colombo',
      latitude: 6.8940,
      longitude: 79.8540,
      isOpen: true,
      isVerified: true,
      deliveryRadiusKm: 4,
      minOrderAmount: 800,
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { isOnline: true, currentLatitude: 6.9271, currentLongitude: 79.8612 },
    create: {
      userId: driverUser.id,
      vehicleType: VehicleType.bike,
      vehicleNumber: 'CAB-1234',
      licenseNumber: 'DL-987654',
      isOnline: true,
      currentLatitude: 6.9271,
      currentLongitude: 79.8612,
    },
  });

  // Pending KYC vendor (unverified)
  const pendingVendorUser = await prisma.user.upsert({
    where: { phone: '+94771234571' },
    update: {},
    create: {
      fullName: 'Pending Vendor',
      phone: '+94771234571',
      email: 'pending@doorli.test',
      role: UserRole.vendor,
      isVerified: true,
    },
  });
  await prisma.vendor.upsert({
    where: { userId: pendingVendorUser.id },
    update: { isVerified: false },
    create: {
      userId: pendingVendorUser.id,
      businessName: 'New Mart (Pending KYC)',
      category: VendorCategory.grocery,
      description: 'Awaiting verification',
      addressLine: '12 Union Place, Colombo 02',
      city: 'Colombo',
      latitude: 6.9210,
      longitude: 79.8550,
      isOpen: false,
      isVerified: false,
      deliveryRadiusKm: 3,
      minOrderAmount: 400,
    },
  });

  // Extra LocalConnect verticals (hotel / hall / beauty / service)
  const verticalSeeds: Array<{
    phone: string;
    email: string;
    username: string;
    fullName: string;
    businessName: string;
    category: VendorCategory;
    description: string;
  }> = [
    {
      phone: '+94771234572',
      email: 'hotel@doorli.test',
      username: 'seaview',
      fullName: 'Hotel Manager',
      businessName: 'Sea View Rooms',
      category: VendorCategory.hotel,
      description: 'Guesthouse rooms with instant booking',
    },
    {
      phone: '+94771234573',
      email: 'hall@doorli.test',
      username: 'grandhall',
      fullName: 'Hall Manager',
      businessName: 'Grand Lotus Hall',
      category: VendorCategory.hall,
      description: 'Wedding & conference venue',
    },
    {
      phone: '+94771234574',
      email: 'beauty@doorli.test',
      username: 'glowspa',
      fullName: 'Spa Owner',
      businessName: 'Glow Beauty Studio',
      category: VendorCategory.beauty,
      description: 'Salon & spa appointments',
    },
    {
      phone: '+94771234575',
      email: 'service@doorli.test',
      username: 'fixitpro',
      fullName: 'Service Pro',
      businessName: 'FixIt Home Services',
      category: VendorCategory.service,
      description: 'Plumbers, electricians, AC techs',
    },
  ];

  for (const v of verticalSeeds) {
    const u = await prisma.user.upsert({
      where: { phone: v.phone },
      update: {
        email: v.email,
        username: v.username,
        passwordHash,
        isVerified: true,
      },
      create: {
        fullName: v.fullName,
        phone: v.phone,
        email: v.email,
        username: v.username,
        passwordHash,
        role: UserRole.vendor,
        isVerified: true,
      },
    });
    await prisma.vendor.upsert({
      where: { userId: u.id },
      update: {
        businessName: v.businessName,
        category: v.category,
        description: v.description,
        isVerified: true,
        isOpen: true,
      },
      create: {
        userId: u.id,
        businessName: v.businessName,
        category: v.category,
        description: v.description,
        city: 'Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
        isOpen: true,
        isVerified: true,
        deliveryRadiusKm: 8,
      },
    });
  }

  // Link demo grocery vendor to ERP tenant id for inventory/order bridge demos
  await prisma.vendor.update({
    where: { userId: vendorUser.id },
    data: { erpTenantId: '11111111-1111-4111-a111-111111111111' },
  });

  const groceryProducts = [
    { name: 'Fresh Milk 1L', price: 420, unit: 'bottle', category: 'dairy', stock: 50, barcode: '8901001001001', sku: 'MILK-1L' },
    { name: 'White Bread', price: 180, unit: 'loaf', category: 'bakery', stock: 30, barcode: '8901001001002', sku: 'BREAD-W' },
    { name: 'Basmati Rice 5kg', price: 1850, unit: 'pack', category: 'grains', stock: 20, barcode: '8901001001003', sku: 'RICE-5KG' },
    { name: 'Fresh Eggs (10)', price: 650, unit: 'pack', category: 'dairy', stock: 40, barcode: '8901001001004', sku: 'EGGS-10' },
    { name: 'Tomatoes 1kg', price: 350, unit: 'kg', category: 'vegetables', stock: 3, barcode: '8901001001005', sku: 'TOM-1KG' },
  ];

  for (const p of groceryProducts) {
    const existing = await prisma.product.findFirst({
      where: { vendorId: groceryVendor.id, name: p.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          vendorId: groceryVendor.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          category: p.category,
          stockQuantity: p.stock,
          barcode: p.barcode,
          sku: p.sku,
          lowStockAt: 5,
          isAvailable: true,
        },
      });
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: { barcode: p.barcode, sku: p.sku, lowStockAt: 5 },
      });
    }
  }

  const restaurantProducts = [
    { name: 'Chicken Kottu', price: 1200, unit: 'plate', category: 'mains', stock: 100 },
    { name: 'Fish Curry & Rice', price: 950, unit: 'plate', category: 'mains', stock: 100 },
    { name: 'Vegetable Fried Rice', price: 750, unit: 'plate', category: 'mains', stock: 100 },
    { name: 'Mango Juice', price: 350, unit: 'glass', category: 'drinks', stock: 100 },
    { name: 'Watalappan', price: 400, unit: 'piece', category: 'desserts', stock: 50 },
  ];

  for (const p of restaurantProducts) {
    const existing = await prisma.product.findFirst({
      where: { vendorId: restaurantVendor.id, name: p.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          vendorId: restaurantVendor.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          category: p.category,
          stockQuantity: p.stock,
          isAvailable: true,
          prepTimeMins: 20,
        },
      });
    }
  }

  const admin = await prisma.user.upsert({
    where: { phone: '+94770000000' },
    update: {
      email: 'admin@doorli.test',
      username: 'admin',
      passwordHash,
      isVerified: true,
    },
    create: {
      fullName: 'Doorli Admin',
      phone: '+94770000000',
      email: 'admin@doorli.test',
      username: 'admin',
      passwordHash,
      role: UserRole.admin,
      isVerified: true,
    },
  });

  const zones = [
    { name: 'Colombo Central', city: 'Colombo', demandLevel: 3 },
    { name: 'Kandy City', city: 'Kandy', demandLevel: 2 },
    { name: 'Galle Fort', city: 'Galle', demandLevel: 2 },
  ];
  for (const z of zones) {
    const exists = await prisma.geographicZone.findFirst({ where: { name: z.name } });
    if (!exists) await prisma.geographicZone.create({ data: z });
  }

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      description: 'Welcome discount LKR 50 off',
      discountType: 'fixed',
      discountValue: 50,
      minOrderAmount: 500,
      maxUses: 1000,
      isActive: true,
    },
  });

  await prisma.loyaltyPoint.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id, points: 100, earned: 100, redeemed: 0 },
  });

  // Sample paid orders for revenue metrics
  const milk = await prisma.product.findFirst({
    where: { vendorId: groceryVendor.id, name: 'Fresh Milk 1L' },
  });
  const kottu = await prisma.product.findFirst({
    where: { vendorId: restaurantVendor.id, name: 'Chicken Kottu' },
  });

  const existingPaid = await prisma.order.findFirst({
    where: { orderNumber: 'DL-SEED-0001' },
  });
  if (!existingPaid && milk) {
    await prisma.order.create({
      data: {
        orderNumber: 'DL-SEED-0001',
        customerId: customer.id,
        vendorId: groceryVendor.id,
        deliveryAddressId: '00000000-0000-4000-8000-000000000001',
        status: 'delivered',
        orderType: 'delivery',
        subtotal: milk.price,
        deliveryFee: 150,
        discountAmount: 0,
        totalAmount: Number(milk.price) + 150,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        items: {
          create: [
            {
              productId: milk.id,
              quantity: 1,
              unitPrice: milk.price,
              totalPrice: milk.price,
            },
          ],
        },
      },
    });
  }

  const existingPaid2 = await prisma.order.findFirst({
    where: { orderNumber: 'DL-SEED-0002' },
  });
  if (!existingPaid2 && kottu) {
    await prisma.order.create({
      data: {
        orderNumber: 'DL-SEED-0002',
        customerId: customer.id,
        vendorId: restaurantVendor.id,
        deliveryAddressId: '00000000-0000-4000-8000-000000000001',
        status: 'preparing',
        orderType: 'delivery',
        subtotal: kottu.price,
        deliveryFee: 200,
        discountAmount: 50,
        totalAmount: Number(kottu.price) + 200 - 50,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        items: {
          create: [
            {
              productId: kottu.id,
              quantity: 1,
              unitPrice: kottu.price,
              totalPrice: kottu.price,
            },
          ],
        },
      },
    });
  }

  console.log(
    `Seed complete: password for all demo users = ${DEMO_PASSWORD}`,
  );
  console.log(
    `  customer: email=customer@doorli.test username=customer`,
  );
  console.log(
    `  vendor: email=vendor@doorli.test username=vendor business="Corner Grocery"`,
  );
  console.log(
    `  restaurant: email=restaurant@doorli.test username=spicekitchen business="Spice Kitchen"`,
  );
  console.log(`  admin: email=admin@doorli.test username=admin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
