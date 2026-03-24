import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  'mailto:vlastimil.valenta@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { recipientId, title, body, url } = await req.json();

    if (!recipientId) {
      return NextResponse.json({ error: 'Missing recipientId' }, { status: 400 });
    }

    // Get push subscription for recipient
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
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      pushPayload
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    // If subscription expired, clean up
    if (error.statusCode === 410) {
      console.log('Subscription expired, cleaning up');
      return NextResponse.json({ error: 'Subscription expired' }, { status: 410 });
    }
    console.error('Push error:', err);
    return NextResponse.json({ error: 'Push failed' }, { status: 500 });
  }
}
