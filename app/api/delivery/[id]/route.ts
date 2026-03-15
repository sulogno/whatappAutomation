// app/api/delivery/[id]/route.ts

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

  const { data: boy } = await supabaseAdmin
    .from('delivery_boys')
    .select('business_id, business:businesses(owner_email)')
    .eq('id', params.id)
    .single();

  if (!boy) return errorResponse('Delivery boy not found', 'NOT_FOUND', 404);

  const business = boy.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { data: updated, error } = await supabaseAdmin
    .from('delivery_boys')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ delivery_boy: updated });
}
