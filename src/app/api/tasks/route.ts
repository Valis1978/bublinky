import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await taskService.getTasks();

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

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
      // Default: parent assigns to child, child assigns to self
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();
      const targetRole = userRole === 'parent' ? 'child' : 'child';
      const { data: targetUser } = await supabase
        .from('bub_users')
        .select('id')
        .eq('role', targetRole)
        .single();
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
