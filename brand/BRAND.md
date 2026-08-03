# Bublinky — Brand DNA

**Co to je:** iOS companion app pro Viki (10 let) — AI mazlíček, hry, učení, chat s tátou.
**Nálada:** bublinková — kulaté, měkké, lesklé, pastelové. Nic ostrého, nic temného.

## Paleta (Viki theme — zdroj pravdy `src/app/globals.css`)

| Role | Hex |
|---|---|
| Pozadí | `#FFF5F7` (krémová růžová), karty `#FFFFFF` |
| Akcent rose | `#F9A8D4` (hover `#F472B6`) |
| Lavender | `#C4B5FD` |
| Mint | `#86EFAC` |
| Coral | `#FDA4AF` |
| Zlatá (mince/XP) | `#F59E0B` |
| Text | `#1F1F1F` / muted `#9CA3AF` |

Dark „tata" theme: slate `#0F172A` + blue `#3B82F6` (rodičovská část, netýká se grafiky mazlíčků).

## Typografie
Nunito (var `--font-nunito`) — kulatá, přátelská. Žádný mono, žádný serif.

## Tvarové motivy
1. **Bublina** — kruh/superelipsa s leskovým obloučkem vlevo nahoře (signature: každý mazlíček má bubble-shine highlight).
2. Zaoblení `1.25rem` na kartách, pill buttons.
3. Měkké stíny v barvě akcentu (`rgba(249,168,212,0.12)`).

## Charakterový rig „Bublíci" (SVG, `src/components/pet/avatar/`)
- Kulaté chunky tělo (head+body v jednom, à la Pusheen), krátké nožičky, velké oči.
- **Žádné černé obrysy** — kontury v ztmaveném odstínu barvy těla (stroke ~3, round joins).
- Vždy: tvářičky (blush), bubble-shine, bříško světlejší.
- Druhové palety (pastelové, ladí s UI): kočka=rose, pes=honey/zlatá, králík=lavender, drak=mint, jednorožec=bílá+duhová hříva, liška=coral.
- Geometrie kontraktu: viewBox 200×200, tělo střed (100,115); kotvy: hlava-top (100,62), oči y≈104, krk (100,158), záda (150,118). Obličej je sdílená vrstva — stejné souřadnice pro všechny druhy.
- Emoce řídí `mood` z pet-engine (oči+pusa+doplňky: slza, zzz, jiskry, špína).

## Ilustrace a samolepky
- Recraft `recraftv4_1_vector` + brandify na paletu výše; do promptu vždy „no text, no lettering".
- Samolepky: `public/stickers/`, zdrojové SVG `brand/illustrations/`.
- Nikdy negenerovat mazlíčky přes Recraft — ti jsou VŽDY z rigu (konzistence kotev).

## Tón obsahu
Česky, kamarádsky, nikdy rozkazovačně („Pojď, uděláme to spolu!"). Angličtina nenásilně dle `englishLevel`. Jídlo = citlivé téma, nikdy netlačit. Emoji střídmě, vždy max 1–2 na větu.
