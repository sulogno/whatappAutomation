// app/api/businesses/[id]/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { compressBusinessInfo } from '@/lib/ai-context';
import { errorResponse } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .select()
    .eq('id', params.id)
    .single();

  if (error || !business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  // Security check — make sure this business belongs to the logged in user
  if (business.owner_email !== session.user.email && business.owner_id !== session.user.id) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  return Response.json({ business });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();

  // Find business by ID using admin client (bypasses RLS)
  const { data: existing, error: findError } = await supabaseAdmin
    .from('businesses')
    .select('id, owner_email, owner_id')
    .eq('id', params.id)
    .single();

  if (findError || !existing) {
    console.error('[PATCH business] Not found:', params.id, findError);
    return errorResponse('Business not found', 'NOT_FOUND', 404);
  }

  // Security: verify ownership by email OR by user ID
  const isOwner =
    existing.owner_email === session.user.email ||
    existing.owner_id === session.user.id;

  if (!isOwner) {
    console.error('[PATCH business] Unauthorized:', session.user.email, 'vs', existing.owner_email);
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  // Build clean update object — only allow safe fields
  const allowedFields = [
    'name',
    'ai_context',
    'whatsapp_number',
    'whatsapp_phone_id',
    'whatsapp_access_token',
    'opening_time',
    'closing_time',
    'closed_days',
    'language',
    'is_open',
    'business_type',
  ];

  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Compress ai_context if provided
  if (updateData.ai_context) {
    updateData.ai_context = compressBusinessInfo(updateData.ai_context);
  }

  // Clean phone number
  if (updateData.whatsapp_number) {
    updateData.whatsapp_number = updateData.whatsapp_number.replace(/\D/g, '');
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('businesses')
    .update(updateData)
    .eq('id', existing.id)
    .select()
    .single();

  if (updateError) {
    console.error('[PATCH business] Update error:', updateError);
    return errorResponse(updateError.message, 'DB_ERROR', 500);
  }

  return Response.json({ business: updated });
}