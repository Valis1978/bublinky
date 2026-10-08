import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/services/task.service';
import { requestSession } from '@/lib/server/authorize-user';
import { z } from 'zod';

const completionSchema = z.object({ action: z.enum(['complete', 'uncomplete']) }).strict();
const updateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(5000).nullable(),
  category: z.enum(['school', 'home', 'fun', 'event']),
  type: z.enum(['one_time', 'recurring', 'event']),
  due_date: z.string().max(64).nullable(),
  emoji: z.string().max(32).nullable(),
  sort_order: z.number().int(),
}).partial().strict().refine((value) => Object.keys(value).length > 0);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const completion = completionSchema.safeParse(body);
    if (completion.success) {
      const assignedTo = session.role === 'child' ? session.user_id : undefined;
      const { error, notFound } = completion.data.action === 'complete'
        ? await taskService.completeTask(id, assignedTo)
        : await taskService.uncompleteTask(id, assignedTo);
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      if (notFound) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true });
    }
    if (session.role !== 'parent') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const updates = updateSchema.safeParse(body);
    if (!updates.success) {
      return NextResponse.json({ success: false, error: 'Invalid updates' }, { status: 400 });
    }
    const { error } = await taskService.updateTask(id, updates.data);
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
  const session = await requestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'parent') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { error } = await taskService.deleteTask(id);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
