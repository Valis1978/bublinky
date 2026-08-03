# Bublinky 🫧

iOS companion appka pro Viki (10) — mazlíček s AI duší, hry, učení, chat s tátou.

**Web:** Next.js 16 + React 19 + TS strict + Tailwind 4 · **iOS:** Capacitor shell načítající `https://bublinky.mujagent.cz` · **DB:** Supabase (Valis1978, tabulky `bub_*`) · **AI:** Gemini 3 Flash (duše mazlíčka, kvízy, příběhy, počasí)

## Hlavní části

| Oblast | Kde | Co |
|---|---|---|
| Mazlíček „Bublík" | `/pet`, `src/lib/pet-engine.ts` | Tamagotchi RPG: staty, XP, evoluce, skilly, AI chat s pamětí |
| Avatar rig | `src/components/pet/avatar/` | Ručně kreslené SVG postavičky — 6 druhů × 6 fází × nálady, oblečky, animace (kontrakt v `types.ts`, reference `species/cat.tsx`) |
| Pokojíček | `src/components/pet/room/` | Scéna s denní dobou (den/soumrak/noc) + umístitelné dekorace |
| Ekonomika | `src/lib/pet-economy.ts`, `item-catalog.ts` | Obchůdek, batoh, oblékání, denní dáreček, streak |
| Samolepky | `src/lib/sticker-catalog.ts`, `/album`, `public/stickers/` | Sběratelské album (Recraft vektory), milníky v `sticker-awards.ts` |
| Domeček | `/home` | Vstupní hub: pozdrav, denní obsah, dáreček, rutiny, odkazy |
| Chat s tátou | `/chat` | Realtime zprávy + reakce + posílání samolepek |
| Rodič | `/dashboard`, `/parent` | Aktivita, poloha, úkoly |

## Dev

```bash
npm run dev        # localhost:3000
npx tsc --noEmit   # typecheck
npm run build
```

Env: viz `.env.local.example`. Auth = PIN → JWT cookie `bub_session` (middleware).

QA stránka rigu: `/dev/avatars` (za loginem).

## Deploy

Web: Coolify app `bublinky-app` (uuid `ybilplohu5vsoc8q321r5art`), Hetzner 49.13.192.85, branch `master`. Deploy se netriggeruje sám — `POST /api/v1/deploy` přes SSH (viz memory `reference_coolify`). iOS shell se nemění, dokud se nesahá na nativní část (Capacitor config, ikony, pluginy) — pak Codemagic nebo lokální Xcode build.

## Design

Zdroj pravdy: `brand/BRAND.md` (paleta, rig kontrakt, tón obsahu). Grafika mazlíčků VŽDY z rigu, nikdy generovaná. Samolepky: Recraft → brandify (skill `/brand-assets`).
