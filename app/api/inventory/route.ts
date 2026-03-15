// app/api/inventory/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { errorResponse } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  const { data: items, error } = await supabaseAdmin
    .from('inventory')
    .select()
    .eq('business_id', business.id)
    .order('category', { ascending: true })
    .order('item_name', { ascending: true });

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ items: items || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();
  const { itemName, category, price, stockQuantity, unit, isAvailable, description } = body;

  if (!itemName) return errorResponse('Item name required', 'MISSING_FIELDS');

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, ai_context')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  const { data: item, error } = await supabaseAdmin
    .from('inventory')
    .insert({
      business_id: business.id,
      item_name: itemName,
      category: category || null,
      price: price || null,
      stock_quantity: stockQuantity || null,
      unit: unit || null,
      is_available: isAvailable !== false,
      description: description || null,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ item }, { status: 201 });
}
