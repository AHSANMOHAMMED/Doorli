import { NextResponse } from 'next/server';

/** Deprecated: status updates go directly to Doorli API via client JWT. */
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Use PATCH /api/v1/orders/:id/status on the Doorli API' },
    { status: 410 },
  );
}
