import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');

  const supabase = createAdminClient();
  let query = supabase
    .from('bub_users')
    .select('id, name, role, avatar_url, last_seen_at')
    .order('created_at', { ascending: true });

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
