'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export async function seDeconnecterAction() {
  if (env.supabase.configured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/login');
}
