import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function requestSession(request: NextRequest) {
  const token = request.cookies.get('bub_session')?.value;
  return token ? verifySession(token) : null;
}

/** Check the signed cookie again at the service-role boundary, not caller headers. */
export async function authorizeUserRequest(
  request: NextRequest,
  targetUserId: unknown,
  options: { allowParentRead?: boolean } = {},
): Promise<NextResponse | null> {
  const session = await requestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (typeof targetUserId !== 'string' || !targetUserId) {
    return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
  }
  // Bublinky is a single-family application: the parent dashboard can read
  // children's activity, but writes always belong to the signed-in account.
  if (targetUserId !== session.user_id && !(options.allowParentRead && session.role === 'parent')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/** Generated pet responses read/write memories; only the pet's owner may use them. */
export async function authorizePetRequest(request: NextRequest, petId: unknown): Promise<NextResponse | null> {
  const session = await requestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  // Newly-created, not-yet-saved pets can use generation without persistent data.
  if (petId === undefined || petId === null) return null;
  if (typeof petId !== 'string' || !petId) {
    return NextResponse.json({ success: false, error: 'Invalid petId' }, { status: 400 });
  }
  const { data, error } = await createAdminClient()
    .from('bub_pets')
    .select('id')
    .eq('id', petId)
    .eq('user_id', session.user_id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ success: false, error: 'Pet lookup failed' }, { status: 503 });
  }
  if (!data) {
    return NextResponse.json({ success: false, error: 'Pet not found' }, { status: 404 });
  }
  return null;
}
