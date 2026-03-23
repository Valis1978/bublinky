import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, ...updates } = body;

    if (action === 'complete') {
      const { error } = await taskService.completeTask(id);
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'uncomplete') {
      const { error } = await taskService.uncompleteTask(id);
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { error } = await taskService.updateTask(id, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await taskService.deleteTask(id);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
