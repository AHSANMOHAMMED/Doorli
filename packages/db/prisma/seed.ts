import { PrismaClient, UserRole, VendorCategory, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Doorli database...');

  const customer = await prisma.user.upsert({
    where: { phone: '+94771234567' },
    update: {},
    create: {
      fullName: 'Test Customer',
      phone: '+94771234567',
      email: 'customer@doorli.test',
      role: UserRole.customer,
      isVerified: true,
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { phone: '+94771234568' },
    update: {},
    create: {
      fullName: 'Test Vendor Owner',
      phone: '+94771234568',
      email: 'vendor@doorli.test',
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
    update: {},
    create: {
      fullName: 'Restaurant Owner',
      phone: '+94771234570',
      email: 'restaurant@doorli.test',
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
    update: {},
    create: {
      userId: driverUser.id,
      vehicleType: VehicleType.bike,
      vehicleNumber: 'CAB-1234',
      licenseNumber: 'DL-987654',
      isOnline: false,
      currentLatitude: 6.9271,
      currentLongitude: 79.8612,
    },
  });

  const groceryProducts = [
    { name: 'Fresh Milk 1L', price: 420, unit: 'bottle', category: 'dairy', stock: 50 },
    { name: 'White Bread', price: 180, unit: 'loaf', category: 'bakery', stock: 30 },
    { name: 'Basmati Rice 5kg', price: 1850, unit: 'pack', category: 'grains', stock: 20 },
    { name: 'Fresh Eggs (10)', price: 650, unit: 'pack', category: 'dairy', stock: 40 },
    { name: 'Tomatoes 1kg', price: 350, unit: 'kg', category: 'vegetables', stock: 25 },
  ];

  for (const p of groceryProducts) {
    await prisma.product.create({
      data: {
        vendorId: groceryVendor.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        category: p.category,
        stockQuantity: p.stock,
        isAvailable: true,
      },
    });
  }

  const restaurantProducts = [
    { name: 'Chicken Kottu', price: 1200, unit: 'plate', category: 'mains', stock: 100 },
    { name: 'Fish Curry & Rice', price: 950, unit: 'plate', category: 'mains', stock: 100 },
    { name: 'Vegetable Fried Rice', price: 750, unit: 'plate', category: 'mains', stock: 100 },
    { name: 'Mango Juice', price: 350, unit: 'glass', category: 'drinks', stock: 100 },
    { name: 'Watalappan', price: 400, unit: 'piece', category: 'desserts', stock: 50 },
  ];

  for (const p of restaurantProducts) {
    await prisma.product.create({
      data: {
        vendorId: restaurantVendor.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        category: p.category,
        stockQuantity: p.stock,
        isAvailable: true,
      },
    });
  }

  console.log('Seed complete: 4 users, 2 vendors, 10 products, 1 driver');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
