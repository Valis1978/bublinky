import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requestSession } from '@/lib/server/authorize-user';

export async function GET(request: NextRequest) {
  const session = await requestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await taskService.getTasks(session.role === 'child' ? session.user_id : undefined);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const session = await requestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'parent') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const userId = session.user_id;

  try {
    const body = await request.json();
    const { title, description, category, type, due_date, emoji, assigned_to } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get the other user's ID for assignment
    let assignTo = assigned_to;
    if (!assignTo) {
      // Only parents create tasks; the default assignee is the oldest child.
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();
      // Oldest account of the role is the real one (test accounts come later)
      const { data: targetUser } = await supabase
        .from('bub_users')
        .select('id')
        .eq('role', 'child')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      assignTo = targetUser?.id || userId;
    }

    const { data, error } = await taskService.createTask({
      created_by: userId,
      assigned_to: assignTo,
      title,
      description,
      category,
      type,
      due_date,
      emoji,
    });

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
