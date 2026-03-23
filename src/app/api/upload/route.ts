import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (images + audio + video)
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isAudio && !isVideo) {
      return NextResponse.json(
        { success: false, error: 'Only images, audio and video allowed' },
        { status: 400 }
      );
    }

    // Max 50MB for video, 10MB for others
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `Soubor je moc velký (max ${isVideo ? '50' : '10'}MB)` },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : isAudio ? 'mp4' : 'jpg');
    const filename = `${crypto.randomUUID()}.${ext}`;
    const folder = isVideo ? 'videos' : isAudio ? 'voice' : 'photos';
    const path = `${folder}/${filename}`;

    const supabase = createAdminClient();
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('bublinky')
      .upload(path, bytes, {
        contentType: file.type,
        cacheControl: '31536000',
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from('bublinky')
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      data: { url: urlData.publicUrl, path },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
