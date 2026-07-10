import { NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Decode the JWE token from NextAuth
    const decoded = await decode({ token, secret, salt: "company-session" });

    if (!decoded) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
    }

    // Map NextAuth user to Doorli Marketplace format
    return NextResponse.json({
      valid: true,
      user: {
        id: decoded.id, // NextAuth user ID
        accountId: decoded.accountId,
        role: decoded.role || 'vendor', // Fallback role
        tenantId: decoded.tenantId,
        isOwner: decoded.isOwner,
        email: decoded.email,
        name: decoded.name,
      }
    });
  } catch (error) {
    console.error('ERP Auth Validation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
