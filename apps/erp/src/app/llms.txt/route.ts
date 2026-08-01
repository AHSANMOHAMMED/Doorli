import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const content = `# Doorli ERP

> AI-powered cloud POS and ERP platform for retail stores, restaurants, supermarkets, auto service centers, and vehicle dealerships. All features on every plan. Unlimited users. Free to start.

Doorli ERP is a multi-tenant SaaS business management system built for five business types. It provides point of sale, inventory management, double-entry accounting, HR and payroll, kitchen display, work order management, and AI-powered analytics in a single platform. Every plan includes every feature with no feature gating. The first company per account is free forever with no credit card required.

## Key Pages

- [Home](https://www.erp.doorli.me/): Product overview and value proposition
- [Features](https://www.erp.doorli.me/features): Complete feature list across all modules
- [Pricing](https://www.erp.doorli.me/pricing): Transparent storage-based pricing, all features included
- [Retail POS](https://www.erp.doorli.me/retail): Barcode scanning, inventory, loyalty programs, gift cards
- [Restaurant](https://www.erp.doorli.me/restaurant): Kitchen display, table management, floor plan, reservations, recipes
- [Supermarket](https://www.erp.doorli.me/supermarket): High-volume checkout, department management, batch tracking
- [Auto Service](https://www.erp.doorli.me/auto-service): Work orders, vehicle tracking, inspections, insurance estimates
- [Vehicle Dealership](https://www.erp.doorli.me/dealership): Vehicle inventory, sales pipeline, trade-ins, test drives

## Company

- [About](https://www.erp.doorli.me/about): Our mission and technology
- [Contact](https://www.erp.doorli.me/contact): Support and inquiries
- [Privacy Policy](https://www.erp.doorli.me/privacy): Data handling and security practices
- [Terms of Service](https://www.erp.doorli.me/terms): Usage terms and conditions

## Getting Started

- [Register](https://www.erp.doorli.me/register): Create a free account — no credit card required
- [Login](https://www.erp.doorli.me/login): Sign in to your account
- [Full Product Details](/llms-full.txt): Extended product information for AI systems
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
