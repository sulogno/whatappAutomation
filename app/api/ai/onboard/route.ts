// app/api/ai/onboard/route.ts

import { NextRequest } from 'next/server';
import { generateOnboardingResponse } from '@/lib/groq';
import { errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { businessInfo, step } = await req.json();

  if (!step) return errorResponse('step required', 'MISSING_FIELDS');

  const response = await generateOnboardingResponse(businessInfo || '', step);
  return Response.json({ response });
}
