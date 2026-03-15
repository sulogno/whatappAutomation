// app/api/ai/classify/route.ts

import { NextRequest } from 'next/server';
import { classifyIntent } from '@/lib/groq';
import { errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message) return errorResponse('message required', 'MISSING_FIELDS');

  const intent = await classifyIntent(message);
  return Response.json({ intent });
}
