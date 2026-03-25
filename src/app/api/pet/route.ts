import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

/** GET /api/pet?userId=xxx — load pet from Supabase */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bub_pets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Pet not found' }, { status: 404 });
    }

    // Map snake_case DB → camelCase PetState
    const pet = {
      id: data.id,
      name: data.name,
      species: data.species,
      born: data.born,
      hunger: data.hunger,
      happiness: data.happiness,
      energy: data.energy,
      cleanliness: data.cleanliness,
      xp: data.xp,
      level: data.level,
      stage: data.stage,
      coins: data.coins,
      skills: {
        strength: data.skill_strength,
        wisdom: data.skill_wisdom,
        charisma: data.skill_charisma,
        creativity: data.skill_creativity,
        nature: data.skill_nature,
      },
      evolutionPath: data.evolution_path,
      lastUpdate: data.last_update,
      lastFed: data.last_fed,
      lastPlayed: data.last_played,
      lastSlept: data.last_slept,
      lastBathed: data.last_bathed,
      lastTreated: data.last_treated,
      lastChatted: data.last_chatted,
      isAlive: true,
      isSleeping: data.is_sleeping,
      isOnVacation: data.is_on_vacation,
      vacationReturn: data.vacation_return,
      mood: data.mood,
      accessories: data.accessories || [],
      activeOutfit: data.active_outfit || {},
      personalityTraits: data.personality_traits || {},
      foodBravery: data.food_bravery,
      foodsTried: data.foods_tried || [],
      favoriteFoods: data.favorite_foods || [],
      englishLevel: data.english_level || 0,
      englishWordsLearned: data.english_words_learned || [],
    };

    return NextResponse.json({ success: true, pet });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

/** PUT /api/pet — save/upsert pet to Supabase */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, pet } = body;
    if (!userId || !pet) return NextResponse.json({ success: false, error: 'userId and pet required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const dbPet = {
      user_id: userId,
      name: pet.name,
      species: pet.species,
      born: pet.born,
      hunger: Math.round(Math.min(100, Math.max(0, pet.hunger))),
      happiness: Math.round(Math.min(100, Math.max(0, pet.happiness))),
      energy: Math.round(Math.min(100, Math.max(0, pet.energy))),
      cleanliness: Math.round(Math.min(100, Math.max(0, pet.cleanliness))),
      xp: pet.xp,
      level: pet.level,
      stage: pet.stage,
      coins: pet.coins ?? 50,
      evolution_path: pet.evolutionPath || null,
      skill_strength: pet.skills?.strength || 0,
      skill_wisdom: pet.skills?.wisdom || 0,
      skill_charisma: pet.skills?.charisma || 0,
      skill_creativity: pet.skills?.creativity || 0,
      skill_nature: pet.skills?.nature || 0,
      last_update: pet.lastUpdate,
      last_fed: pet.lastFed,
      last_played: pet.lastPlayed,
      last_slept: pet.lastSlept,
      last_bathed: pet.lastBathed,
      last_treated: pet.lastTreated || pet.lastFed,
      last_chatted: pet.lastChatted || pet.born,
      is_sleeping: pet.isSleeping,
      is_on_vacation: pet.isOnVacation || false,
      vacation_return: pet.vacationReturn || null,
      mood: pet.mood,
      accessories: pet.accessories || [],
      active_outfit: pet.activeOutfit || {},
      personality_traits: pet.personalityTraits || {},
      food_bravery: pet.foodBravery || 0,
      foods_tried: pet.foodsTried || [],
      favorite_foods: pet.favoriteFoods || [],
      english_level: pet.englishLevel || 0,
      english_words_learned: pet.englishWordsLearned || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('bub_pets')
      .upsert(dbPet, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, petId: data.id });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
