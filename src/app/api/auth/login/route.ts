import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyPin,
  createSession,
  checkRateLimit,
  recordLoginAttempt,
} from '@/lib/auth';
import type { UserRole } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { pin, role } = (await request.json()) as {
      pin: string;
      role: UserRole;
    };

    if (!pin || !role || !['parent', 'child'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Neplatný požadavek' },
        { status: 400 }
      );
    }

    // Rate limiting by IP + role
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${ip}:${role}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Příliš mnoho pokusů. Zkus to za ${Math.ceil(rateCheck.cooldownSeconds / 60)} minut.`,
        },
        { status: 429 }
      );
    }

    // A role can have more than one account (e.g. a QA test child), so match
    // the PIN against every candidate instead of expecting exactly one row.
    const supabase = createAdminClient();
    const { data: candidates, error } = await supabase
      .from('bub_users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Login lookup failed:', error);
      return NextResponse.json(
        { success: false, error: 'Chyba serveru' },
        { status: 500 }
      );
    }

    let user = null;
    for (const candidate of candidates ?? []) {
      if (candidate.pin_hash && (await verifyPin(pin, candidate.pin_hash))) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      recordLoginAttempt(rateLimitKey, false);
      const remaining = rateCheck.remainingAttempts - 1;
      return NextResponse.json(
        {
          success: false,
          error:
            remaining > 0
              ? `Nesprávný PIN. Zbývá ${remaining} pokusů.`
              : 'Nesprávný PIN. Účet dočasně zablokován.',
        },
        { status: 401 }
      );
    }

    recordLoginAttempt(rateLimitKey, true);

    // Update last_seen_at
    await supabase
      .from('bub_users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', user.id);

    const token = await createSession(user.id, user.role, user.name);

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        theme: user.theme,
        avatar_url: user.avatar_url,
      },
    });

    response.cookies.set('bub_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Chyba serveru' },
      { status: 500 }
    );
  }
}
