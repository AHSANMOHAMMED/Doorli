import { NextResponse } from 'next/server';

// Mock data to simulate an Elasticsearch response returning businesses and products
const mockIndex = [
  { id: 'b1', type: 'business', name: 'Mario\'s Pizza', description: 'Authentic Italian Pizzeria', distance: '1.2 km' },
  { id: 'p1', type: 'product', name: 'Pepperoni Pizza', description: 'Large pepperoni with extra cheese from Mario\'s', price: 'LKR 2,500' },
  { id: 'b2', type: 'business', name: 'City Plumbing', description: '24/7 Emergency Plumber', distance: '3.4 km' },
  { id: 'b3', type: 'business', name: 'Fresh Mart Grocery', description: 'Local organic vegetables and daily needs', distance: '0.8 km' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // Simulate latency of an Elasticsearch query
  await new Promise(resolve => setTimeout(resolve, 400));

  const results = mockIndex.filter(item => 
    item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  );

  return NextResponse.json({ results });
}
