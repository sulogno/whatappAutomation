// app/api/queue/[id]/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { moveToNext, markNoShow } from '@/lib/queue';
import { triggerPusherEvent, businessChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { errorResponse } from '@/lib/utils';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { status } = await req.json();

  const { data: entry } = await supabaseAdmin
    .from('queue')
    .select('*, business:businesses(*)')
    .eq('id', params.id)
    .single();

  if (!entry) return errorResponse('Queue entry not found', 'NOT_FOUND', 404);

  const business = entry.business;
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  if (status === 'done') {
    await moveToNext(business.id, business);
    return Response.json({ success: true });
  }

  if (status === 'no_show') {
    await markNoShow(params.id, business.id, business);
    return Response.json({ success: true });
  }

  // For other status updates (called, in_service)
  const { data: updated, error } = await supabaseAdmin
    .from('queue')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  await triggerPusherEvent(
    businessChannel(business.id),
    PUSHER_EVENTS.QUEUE_UPDATED,
    { action: 'status_change', queueId: params.id, status }
  );

  return Response.json({ entry: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: entry } = await supabaseAdmin
    .from('queue')
    .select('business_id, business:businesses(owner_email)')
    .eq('id', params.id)
    .single();

  if (!entry) return errorResponse('Not found', 'NOT_FOUND', 404);

  const business = entry.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  await supabaseAdmin.from('queue').delete().eq('id', params.id);

  await triggerPusherEvent(
    businessChannel(entry.business_id),
    PUSHER_EVENTS.QUEUE_UPDATED,
    { action: 'removed', queueId: params.id }
  );

  return Response.json({ success: true });
}
