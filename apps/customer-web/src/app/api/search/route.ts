import { NextResponse } from 'next/server';

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  vendorId?: string;
  vendor?: { businessName?: string };
};

function getApiBase() {
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const baseUrl = getApiBase();
  const vendorsResponse = await fetch(`${baseUrl}/api/v1/vendors`);
  const vendorsJson = await vendorsResponse.json().catch(() => ({ data: { items: [] } }));
  const vendors: Vendor[] = vendorsJson.data?.items || [];

  const productGroups = await Promise.all(
    vendors.slice(0, 8).map(async (vendor) => {
      const response = await fetch(`${baseUrl}/api/v1/products/vendor/${vendor.id}`);
      const json = await response.json().catch(() => ({ data: { items: [] } }));
      const items: Product[] = json.data?.items || [];
      return items.map((product) => ({ ...product, vendor: { businessName: vendor.businessName } }));
    }),
  );
  const products = productGroups.flat();

  const vendorResults = vendors
    .filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(q) ||
        (vendor.description || '').toLowerCase().includes(q) ||
        (vendor.city || '').toLowerCase().includes(q) ||
        vendor.category.toLowerCase().includes(q),
    )
    .slice(0, 20)
    .map((vendor) => ({
      id: vendor.id,
      type: 'business',
      name: vendor.businessName,
      description: vendor.description || vendor.city || vendor.category,
      distance: undefined,
    }));

  const productResults = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        (product.description || '').toLowerCase().includes(q) ||
        (product.vendor?.businessName || '').toLowerCase().includes(q),
    )
    .slice(0, 20)
    .map((product) => ({
      id: product.id,
      type: 'product',
      name: product.name,
      description: product.vendor?.businessName || product.description || '',
      price:
        product.price != null
          ? `LKR ${Number(product.price).toLocaleString()}`
          : undefined,
      vendorId: product.vendorId,
    }));

  return NextResponse.json({ results: [...vendorResults, ...productResults].slice(0, 40) });
}
