import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { embedText, toVectorLiteral } from '@/lib/server/embeddings';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

const MAX_QUESTION_LENGTH = 200;
const MAX_ANSWER_LENGTH = 60;

/** POST /api/pet/poll — store a daily poll answer as a pet memory ("Anketka") */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, pollId, question, answer } = body;

    if (!userId || !pollId) {
      return NextResponse.json({ success: false, error: 'userId a pollId jsou povinné' }, { status: 400 });
    }

    const q = typeof question === 'string' ? question.trim() : '';
    const a = typeof answer === 'string' ? answer.trim() : '';

    if (!q || q.length > MAX_QUESTION_LENGTH || !a || a.length > MAX_ANSWER_LENGTH) {
      return NextResponse.json({ success: false, error: 'Neplatná otázka nebo odpověď' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // bub_pet_memories is keyed by pet_id, not user_id — resolve it first (same as GET /api/pet)
    const { data: pet, error: petError } = await supabase
      .from('bub_pets')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (petError || !pet) {
      return NextResponse.json({ success: false, error: 'Pet not found' }, { status: 404 });
    }

    // Same insert shape as src/app/api/pet/chat/route.ts (pet_id, category, content, importance)
    const memory = {
      pet_id: pet.id,
      category: 'preference',
      content: `Anketka: ${q} → Viki: ${a}`,
      importance: 6,
    };

    // Embedding is a soft dependency — the poll answer is stored either way.
    let vectorLiteral: string | null = null;
    try {
      vectorLiteral = toVectorLiteral(await embedText(memory.content, 'RETRIEVAL_DOCUMENT'));
    } catch (embedErr) {
      console.error('[PetPoll] memory embedding failed:', embedErr);
    }

    let { error } = await supabase
      .from('bub_pet_memories')
      .insert(vectorLiteral ? { ...memory, embedding: vectorLiteral } : memory);

    if (error && vectorLiteral) {
      // Vector column may not exist yet (migration not applied) — retry plain.
      ({ error } = await supabase.from('bub_pet_memories').insert(memory));
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
