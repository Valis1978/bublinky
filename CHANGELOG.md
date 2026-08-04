# Changelog

## 2.0.1 — 2026-08-04

### CZ

**Fix (DB)**
- Migrace `20260803_v2_economy_chat.sql` při přidávání samolepek omylem vyhodila `'video'` z check constraintu `bub_messages_type_check` — poslání videa v chatu padalo na 500 (Postgres 23514)
- Nová migrace `20260804_restore_video_message_type.sql` vrací plnou sadu typů (`text`, `photo`, `voice`, `video`, `sticker`); na živé DB už aplikováno

### EN

**Fix (DB)**
- Migration `20260803_v2_economy_chat.sql` accidentally dropped `'video'` from the `bub_messages_type_check` constraint while adding stickers — sending a chat video failed with a 500 (Postgres 23514)
- Follow-up migration `20260804_restore_video_message_type.sql` restores the full type set (`text`, `photo`, `voice`, `video`, `sticker`); already applied to the live DB

## 2.0.0 — 2026-08-03 „Bublíci ožili"

### CZ

**Personifikovaná grafika**
- Ručně kreslený SVG rig mazlíčků („Bublíci") — 6 druhů × 6 vývojových fází × 9 nálad, žádná emoji
- Mrkání, dýchání, vrtění ocáskem, cukání ouškama; nálady mění obličej (slzička, zzz, jiskry, špína)
- Oblečky z obchůdku se skutečně nosí (korunka, brýle, šálička, plášť, křidélka…), evoluce má vlastní rekvizity
- Vajíčko má vzor podle druhu a spí, dokud se nevylíhne

**Pokojíček**
- Mazlíček bydlí v pokojíčku s oknem — scéna žije podle denní doby (den / soumrak / noc)
- Dekorace z obchůdku se umisťují do pokojíčku (lampička v noci svítí, hvězdy září)

**Ekonomika — mince mají konečně smysl**
- Obchůdek: jídlo, hračky, oblečky, dekorace (rarity)
- Batoh: použít, nasadit/sundat, umístit/uklidit
- Denní dáreček na Domečku: mince + šance na samolepku, streak

**Samolepkové album**
- 16 sběratelských samolepek (vlastní vektorová grafika) ve 3 raritách
- Milníky: dárečky, streaky, hry, učení, odvaha u jídla + 1 tajná
- Nasbírané samolepky jde posílat tátovi v chatu

**Domeček (nová úvodní stránka)**
- Pozdrav s mazlíčkem, vtípek/faktík/mise/slovíčko dne (70+ položek)
- Denní dáreček, náhled rutin, rychlé odkazy
- Navigace podle role: Viki má mazlíčka (jménem!) přímo v liště, táta dashboard

**Chat**
- Reakce na zprávy (dvojklik / podržení) s počítadly
- Posílání samolepek

**Ostatní**
- Haptika v celé appce (iOS)
- AI duše ví o novinkách a tajemné samolepce
- DB: nové sloupce bub_pets + reakce a sticker typ v bub_messages (aditivní migrace)

### EN

**Personified art:** hand-built SVG character rig (6 species × 6 stages × 9 moods) with idle animations, wearable shop accessories, evolution props and species-patterned eggs — replacing all emoji sprites.
**Pet room:** day/dusk/night scene with placeable decorations (lamp glows at night).
**Economy loop closed:** shop → backpack → equip/place; daily gift with streaks.
**Sticker album:** 16 collectible vector stickers, rarity tiers, milestone awards, sendable in chat.
**Home hub:** greeting with the pet, daily content pool (70+), gift, routines, quick links; role-aware bottom nav featuring the live pet avatar.
**Chat:** emoji reactions + sticker messages (realtime).
**Misc:** Capacitor haptics everywhere, AI soul aware of new features, additive DB migration (bub_pets economy columns, bub_messages reactions + sticker type).

## 1.5.0 — 2026-07

- Pet RPG se skilly, evolucemi, rutinami a AI duší (Gemini), Food Journey, angličtina
- Chat s tátou, úkoly, 8 her, učení, příběhy, deníček, počasí, rodičovský dashboard
