// app/api/cron/delivery-timeout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { reassignDelivery } from '@/lib/delivery';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Find assignments pending for more than 2 minutes with <= 3 attempts
  const twoMinutesAgo = new Date(Date.now() - 2 * 60000).toISOString();

  const { data: pendingAssignments } = await supabaseAdmin
    .from('delivery_assignments')
    .select()
    .eq('status', 'pending')
    .lte('assigned_at', twoMinutesAgo)
    .lte('attempt_number', 3);

  if (!pendingAssignments || pendingAssignments.length === 0) {
    return Response.json({ reassigned: 0 });
  }

  let reassignedCount = 0;

  for (const assignment of pendingAssignments) {
    await reassignDelivery(assignment.id);
    reassignedCount++;
  }

  console.log(`[Cron Delivery Timeout] Reassigned ${reassignedCount} deliveries`);
  return Response.json({ reassigned: reassignedCount });
}
