// app/api/businesses/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { buildInitialContext, compressBusinessInfo } from '@/lib/ai-context';
import { errorResponse } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .select()
    .eq('owner_email', session.user.email)
    .single();

  if (error || !business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  return Response.json({ business });
}

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();
  const {
    name,
    businessType,
    whatsappNumber,
    whatsappPhoneId,
    whatsappAccessToken,
    language,
    openingTime,
    closingTime,
    closedDays,
    description,
  } = body;

  // Only name and businessType are required — WhatsApp can be added later
  if (!name || !businessType) {
    return errorResponse('Missing required fields', 'MISSING_FIELDS');
  }

  // Check if business already exists for this user
  const { data: existing } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_email', session.user.email!)
    .single();

  if (existing) {
    // Business exists — update it instead of inserting
    const aiContext = buildInitialContext({
      name,
      businessType,
      description: description || '',
    });

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .update({
        name,
        business_type: businessType,
        whatsapp_number: whatsappNumber ? whatsappNumber.replace(/\D/g, '') : '',
        whatsapp_phone_id: whatsappPhoneId || '',
        whatsapp_access_token: whatsappAccessToken || '',
        ai_context: compressBusinessInfo(aiContext),
        language: language || 'hinglish',
        opening_time: openingTime || '09:00',
        closing_time: closingTime || '21:00',
        closed_days: closedDays || [],
      })
      .eq('owner_email', session.user.email!)
      .select()
      .single();

    if (error) return errorResponse(error.message, 'DB_ERROR', 500);
    return Response.json({ business }, { status: 200 });
  }

  // Create new business
  const aiContext = buildInitialContext({
    name,
    businessType,
    description: description || '',
  });

  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .insert({
      owner_id: session.user.id,
      owner_email: session.user.email!,
      name,
      business_type: businessType,
      whatsapp_number: whatsappNumber ? whatsappNumber.replace(/\D/g, '') : '',
      whatsapp_phone_id: whatsappPhoneId || '',
      whatsapp_access_token: whatsappAccessToken || '',
      ai_context: compressBusinessInfo(aiContext),
      language: language || 'hinglish',
      opening_time: openingTime || '09:00',
      closing_time: closingTime || '21:00',
      closed_days: closedDays || [],
      owner_phone: body.ownerPhone || '',
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ business }, { status: 201 });
}