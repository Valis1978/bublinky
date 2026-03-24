import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

function initWebPush() {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:vlastimil.valenta@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    initWebPush();
    const supabase = getSupabase();
    const { recipientId, title, body, url } = await req.json();

    if (!recipientId) {
      return NextResponse.json({ error: 'Missing recipientId' }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from('bub_push_subscriptions')
      .select('*')
      .eq('user_id', recipientId)
      .single();

    if (!sub) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const pushPayload = JSON.stringify({
      title: title || '💬 Bublinky',
      body: body || 'Nová zpráva',
      url: url || '/chat',
      tag: 'bublinky-msg-' + Date.now(),
    });

    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      pushPayload
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    if (error.statusCode === 410) {
      return NextResponse.json({ error: 'Subscription expired' }, { status: 410 });
    }
    console.error('Push error:', err);
    return NextResponse.json({ error: 'Push failed' }, { status: 500 });
  }
}
