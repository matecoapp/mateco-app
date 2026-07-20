# mateco – Interná platforma

Táto appka teraz ukladá dáta do vašej vlastnej Supabase databázy (tabuľka
`app_data`) namiesto dočasného úložiska Claude.ai. Tento návod vás prevedie
nahraním na GitHub a spustením na internete cez GitHub Pages — krok za
krokom, aj keď ste to nikdy predtým nerobili.

## Čo budete potrebovať (už máte hotové)

- GitHub účet ✅
- Supabase projekt s tabuľkou `app_data` (key / value / updated_at) ✅
- Supabase **Project URL** a **`anon` / `public`** kľúč (Project Settings → API) ✅

## Krok 1 — Nahratie kódu na GitHub

1. Choďte na **github.com** a prihláste sa.
2. Vpravo hore kliknite na **"+"** → **"New repository"**.
3. **Repository name**: napíšte napr. `mateco-app`.
4. Zvoľte **Private** (súkromný) alebo **Public** (verejný) — obe možnosti
   fungujú, súkromný je jednoduchšie riešenie na začiatok.
5. **Nezaškrtávajte** žiadnu z možností "Add a README", "Add .gitignore" ani
   "Choose a license" — tento balík ich už obsahuje.
6. Kliknite **"Create repository"**.
7. GitHub vám ukáže stránku s pokynmi "…or push an existing repository from
   the command line". Budete potrebovať niekoho s troškou skúsenosti s
   príkazovým riadkom (alebo aplikáciu **GitHub Desktop** — zadarmo,
   `desktop.github.com`, dá sa to cez ňu urobiť aj úplne bez príkazového
   riadku, ťahaním myšou):
   - V GitHub Desktop: **File → Add local repository** → vyberte priečinok
     s týmto projektom → **Publish repository**.

## Krok 2 — Pridanie tajných údajov (Secrets)

Tieto hodnoty appka potrebuje pri "stavianí" (builde), ale **nesmú byť
súčasťou samotného kódu** v repozitári.

1. V repozitári na GitHube choďte na **Settings** (hore v menu repozitára).
2. V ľavom menu: **Secrets and variables → Actions**.
3. Kliknite **"New repository secret"** a pridajte:
   - **Name**: `VITE_SUPABASE_URL` → **Value**: vaša Supabase Project URL
     (napr. `https://xxxxxxxxxxxxx.supabase.co`)
4. Kliknite **"New repository secret"** znova a pridajte:
   - **Name**: `VITE_SUPABASE_ANON_KEY` → **Value**: váš `anon public` kľúč

## Krok 3 — Zapnutie GitHub Pages

1. V repozitári: **Settings → Pages** (v ľavom menu).
2. Pri **"Build and deployment" → "Source"** vyberte **"GitHub Actions"**
   (nie "Deploy from a branch").
3. Uložte, ak sa to pýta.

## Krok 4 — Spustenie

Appka sa automaticky postaví a nasadí zakaždým, keď nahráte zmenu do vetvy
`main` (napr. cez GitHub Desktop → "Push origin"). Prvé spustenie môžete
odštartovať aj ručne:

1. V repozitári choďte na záložku **"Actions"** (hore).
2. Mal by tam byť workflow **"Build a nasadenie na GitHub Pages"**.
3. Ak nebežal automaticky, kliknite naň → **"Run workflow"**.
4. Počkajte cca 1–2 minúty, kým vedľa behu naskočí zelená fajočka ✅.

Potom sa appka nájde na adrese, ktorú GitHub ukáže v **Settings → Pages**
(zvyčajne niečo ako `https://vase-meno.github.io/mateco-app/`).

## Vývoj na vlastnom počítači (voliteľné)

Ak by ste chceli appku niekedy upravovať priamo na počítači (nie cez Claude):

```bash
npm install
cp .env.example .env    # a doplňte skutočné Supabase údaje do .env
npm run dev
```

## Dôležité poznámky

- **`anon` / `public` kľúč** je v poriadku mať aj vo verejnom repozitári —
  Supabase je navrhnutý presne na to, aby tento kľúč mohol byť súčasťou
  appky bežiacej v prehliadači. Skutočnú ochranu dát rieši nastavenie **Row
  Level Security** priamo v Supabase (už máte zapnuté).
- **Nikdy nepoužívajte `service_role` kľúč** v appke ani v repozitári — ten
  dáva neobmedzený prístup ku všetkému.
- Adresa Power Automate (v zabudovanom servisnom protokole) **v kóde stále
  je** — ak plánujete verejný repozitár, dajte mi vedieť, prejdeme spolu
  krokmi, ako ju vytiahnuť von podobným spôsobom ako Supabase kľúče vyššie.
