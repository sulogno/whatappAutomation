// app/api/inventory/[id]/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { errorResponse } from '@/lib/utils';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();

  const { data: item } = await supabaseAdmin
    .from('inventory')
    .select('business_id, business:businesses(owner_email)')
    .eq('id', params.id)
    .single();

  if (!item) return errorResponse('Item not found', 'NOT_FOUND', 404);

  const business = item.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { data: updated, error } = await supabaseAdmin
    .from('inventory')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ item: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: item } = await supabaseAdmin
    .from('inventory')
    .select('business:businesses(owner_email)')
    .eq('id', params.id)
    .single();

  if (!item) return errorResponse('Not found', 'NOT_FOUND', 404);

  const business = item.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  await supabaseAdmin.from('inventory').delete().eq('id', params.id);

  return Response.json({ success: true });
}
