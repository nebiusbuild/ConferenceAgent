import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cancelOperation, getActiveOperations } from '@/lib/agent/abort';

const stopSchema = z.object({
  type: z.enum(['REMINDER', 'FOLLOWUP', 'HUBSPOT_SYNC']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = stopSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type } = parsed.data;

    if (type) {
      const cancelled = cancelOperation(type);
      return NextResponse.json({ stopped: cancelled, type });
    }

    // Stop all active operations
    const active = getActiveOperations();
    for (const op of active) {
      cancelOperation(op);
    }
    return NextResponse.json({ stopped: active.length > 0, stoppedOperations: active });
  } catch (error) {
    console.error('Error stopping agent operation:', error);
    return NextResponse.json(
      { error: 'Failed to stop agent operation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ active: getActiveOperations() });
}
