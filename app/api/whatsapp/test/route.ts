// app/api/whatsapp/test/route.ts
import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { businessId } = await req.json();

  // Get business credentials
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('whatsapp_phone_id, whatsapp_access_token, whatsapp_number, owner_email')
    .eq('id', businessId)
    .eq('owner_email', session.user.email!)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  if (!business.whatsapp_phone_id || !business.whatsapp_access_token) {
    return Response.json({
      connected: false,
      error: 'No credentials saved — add Phone Number ID and Access Token in Settings',
    });
  }

  try {
    // Call Meta API to verify the phone number ID is valid
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${business.whatsapp_phone_id}`,
      {
        headers: {
          Authorization: `Bearer ${business.whatsapp_access_token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      // Parse Meta error messages into human-readable text
      const metaError = data?.error?.message || 'Invalid credentials';

      if (metaError.includes('Invalid OAuth') || metaError.includes('token')) {
        return Response.json({
          connected: false,
          error: 'Access token is invalid or expired — generate a new one from Meta',
        });
      }

      if (metaError.includes('not found') || res.status === 404) {
        return Response.json({
          connected: false,
          error: 'Phone Number ID not found — check it in WhatsApp → API Setup',
        });
      }

      return Response.json({
        connected: false,
        error: metaError,
      });
    }

    // Success — extract phone number from Meta response
    const phoneNumber = data.display_phone_number || business.whatsapp_number;

    return Response.json({
      connected: true,
      phoneNumber: phoneNumber,
      displayName: data.verified_name || data.display_name,
      qualityRating: data.quality_rating,
    });

  } catch (err) {
    console.error('[WhatsApp Test] Error:', err);
    return Response.json({
      connected: false,
      error: 'Could not reach WhatsApp servers — check your internet connection',
    });
  }
}