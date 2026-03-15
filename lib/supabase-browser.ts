// lib/supabase-browser.ts — Supabase browser client

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createBrowserClient = () => createClientComponentClient();
