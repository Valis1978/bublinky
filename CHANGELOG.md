# Changelog

### 2026-10-07 — Next.js 16.3.8 (bezpečnostní záplata / security patch)

- **CZ:** Next.js z 16.2.1 na 16.3.8 kvůli bezpečnostním opravám z 30. 9. 2026 (SSRF v optimalizaci obrázků, otrava ISR cache při vlastním hostingu). Skok mezi menšími verzemi přináší i drobné změny frameworku, kód aplikace se nemění.
- **EN:** Next.js 16.2.1 → 16.3.8 for the 2026-09-30 security fixes (image optimizer SSRF, ISR cache poisoning when self-hosting). The minor-version jump brings small framework changes; app code unchanged.

## 2.1.0 — 2026-08-04 „Příběhy ožily"

### CZ

**Interaktivní příběhy** (postaveno na výzkumu dětské motivace)
- Příběh se větví: 6 segmentů, po každém volba (sloveso + emoji), hrdinka = Viki a její mazlíček jménem
- **Knižní cameo**: ~ve 30 % příběhů nečekaně vstoupí postava z dětské knížky (Harry Potter, Hermiona, Matylda, Pipi, Greg z Poseroutky, Malý princ, Fifinka, Hihlík, Mikeš, Ferda, Ronja, Karlík, Kvak) — mluví svým hlasem, zeptá se „už jsi o mně četla?" a nadchne svým světem; titul knihy postava nikdy nejmenuje (žádná skrytá reklama) — fakta ukáže kartička „je z knížky" až po příběhu
- **Polička** — soukromý čtenářský deníček (chci číst → čtu → dočteno), bez počítadel, bez odměn, bez streaků (overjustification guardrail)
- Moje příběhy — uložené příběhy k opakovanému čtení
- Dvoufázová bezpečnost: zákazy v promptu + moderační kontrola každého segmentu
- Book talk: po dočteném příběhu se mazlíček sám zeptá na dojmy (otevřená otázka, nikdy kvíz)

**Chat hry s mazlíčkem**
- Režimy: Hádanky 🧩 · Hádej zvíře 🦁 · Příběh na střídačku 📖 · Co bys radši? 🤔 (30 hádanek + 30 otázek jako záloha)

**Nové minihry**
- **Bublinkovaná** 🫧 — canvas pop hra: 60s kola, hvězdičkové/zlaté/obří bubliny, série → duhový žolík, mazlíček fandí; „Klídek režim" bez času a bodů
- **Módní přehlídka** 👗 — obleč mazlíčka z vlastních oblečků na 3 témata, porota tří Bublíků boduje (nikdy zdrcující) s vtipnými komentáři

**Odměny ve hrách**
- Všech 8 stávajících her dává mince (první 3 kola denně, pravidla viditelná); i „prohra" něco dá — žádný trest

**Denní anketka**
- Mazlíček se jednou denně hravě zeptá (40 otázek, buď/anebo) — odpovědi se propisují do jeho paměti, takže Viki skutečně poznává

**Ostatní**
- Domeček: anketka karta; Hry: nový hub s fandícím mazlíčkem
- Oprava: GOOGLE_API_KEY v produkci byl neplatný (stará rotace) — AI duše, počasí a kvízy zase žijí

### EN

**Interactive branching stories** (6 segments, verb+emoji choices, Viki + her pet as heroes) with **book-character cameos** (13 beloved characters, original voices, "have you read about me?" — never naming their book in-fiction; factual book card outside the story), a private reading shelf (no counters/rewards/streaks per overjustification research), saved stories, two-phase content safety, and post-story book talk in pet chat. **Chat game modes** (riddles, 20 questions, alternating story, would-you-rather). **Two new minigames**: canvas Bubble Pop (60s rounds, calm mode, juice) and Fashion Show (dress your pet from owned accessories, three-pet jury). **Coin rewards** across all 8 existing games (first 3 rounds/day). **Daily pet poll** feeding the AI soul's memories. Fixed an invalid production GOOGLE_API_KEY that had silently broken all AI features.

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
