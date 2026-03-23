import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/stats?userId=xxx — Load stats from DB
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('bub_user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found (first time user)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    // Return defaults — no row yet
    return NextResponse.json({
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      sessions_completed: 0,
      correct_answers: 0,
      games_won: 0,
      tasks_completed: 0,
      unlocked_achievements: [],
    });
  }

  return NextResponse.json(data);
}

// PUT /api/stats — Upsert stats to DB
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, stats } = body;

    if (!userId || !stats) {
      return NextResponse.json({ error: 'Missing userId or stats' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('bub_user_stats')
      .upsert({
        user_id: userId,
        total_xp: stats.totalXP ?? 0,
        current_streak: stats.currentStreak ?? 0,
        longest_streak: stats.longestStreak ?? 0,
        last_activity_date: stats.lastActivityDate ?? null,
        sessions_completed: stats.sessionsCompleted ?? 0,
        correct_answers: stats.correctAnswers ?? 0,
        games_won: stats.gamesWon ?? 0,
        tasks_completed: stats.tasksCompleted ?? 0,
        unlocked_achievements: stats.unlockedAchievements ?? [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Stats upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
