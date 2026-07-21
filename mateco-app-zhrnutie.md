# mateco-app — kompletné zhrnutie projektu (poistka pre novú konverzáciu)

Toto je referenčný dokument pre prípad, že by bolo treba pokračovať v novej
konverzácii s Claude. Stačí nahrať aktuálny `src/App.jsx` (alebo celý
`mateco-project.zip`) spolu s týmto dokumentom a Claude bude vedieť
nadviazať bez straty kontextu.

## Čo appka je

Interná webová appka pre mateco Slovakia s.r.o. — Požičovňa (dispečing,
kalendár, zákazky, prepravy, šoféri) + Servis (poškodenia, externé zákazky,
revízie, úradné skúšky, plán servisu, protokoly). Pôvodne vznikla ako
Claude.ai artifact, postupne prerobená na **skutočný samostatný web** (Vite +
React), nasadený cez **GitHub Pages**, s dátami v **Supabase** (Postgres +
Auth). Jediný zdrojový súbor: `src/App.jsx` (cca 7000+ riadkov, jeden
veľký súbor so všetkými komponentmi).

## Technický stack

- **Frontend**: Vite + React (jeden súbor `src/App.jsx`), žiadny router,
  navigácia cez `module`/`view` state.
- **Dáta**: Supabase Postgres, jedna tabuľka `app_data` (key/value/jsonb),
  key-value úložisko — `loadKey(key, fallback)` / `saveKey(key, value)`.
- **Auth**: Supabase Auth (email + heslo). Tabuľka `profiles` (id, name,
  role, active) naviazaná na `auth.users`. Prvý registrovaný človek sa
  automaticky stane adminom (DB trigger `handle_new_user`).
- **RLS**: `app_data` povoľuje čítanie/zápis len prihláseným, aktívnym
  používateľom s **platnou rolou** (whitelist 8 rolí — pozri nižšie),
  nie len "nezaradeny" blacklist. Toto bolo vedomé sprísnenie po objavení
  medzery (stará rola "citatel" prešla cez pôvodné pravidlo).
- **Nasadenie**: GitHub repo → GitHub Actions (`.github/workflows/deploy.yml`)
  → build → GitHub Pages. Supabase URL/kľúč ako GitHub Secrets
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), injektované pri builde.
- **Mailto**: appka nepoužíva žiadny backend na odosielanie mailov —
  `composeMail()` buď otvorí Outlook Web (`outlook.office.com/mail/deeplink/compose`)
  alebo `mailto:` (desktop/mobil), voľba sa pýta raz a ukladá do
  `localStorage` (`mateco_mail_client_pref`).

## Role a práva

8 skutočných rolí + 1 technický stav:

```
admin, veduci_pozicovne, veduci_servisu, obchodnik,
dispecer_pozicovne, sofer, dispecer_servisu, technik,
nezaradeny (default pre nových registrantov, nevidí nič)
```

Práva sú v objekte `PERM` (kľúč = akcia, hodnota = zoznam povolených rolí,
admin má vždy všetko). Aktuálny stav (môže sa meniť, toto je snímka):

```js
machine_add: ["veduci_pozicovne"]
machine_import_csv: []          // len admin
machine_clear_all: []           // len admin
machine_edit: ["veduci_pozicovne","veduci_servisu","dispecer_pozicovne"]
machine_archive: ["veduci_pozicovne"]
machine_delete: []              // len admin
machine_track_toggle: ["veduci_pozicovne","dispecer_pozicovne"]
machine_report_damage: [VŠETCI]
job_add / job_edit / job_complete / job_email: ["veduci_pozicovne","dispecer_pozicovne"]
job_import_csv: []              // len admin
job_report_damage: [VŠETCI]
transport_assign_driver: ["veduci_pozicovne","dispecer_pozicovne"]
driver_add / driver_edit: ["veduci_pozicovne","dispecer_pozicovne"]
driver_archive: ["veduci_pozicovne"]
driver_delete: []                // len admin
damage_assign/status/delete, external_add/assign/status/delete,
revision_assign/complete, uradnaskuska_assign/complete: ["veduci_servisu","dispecer_servisu"]
plan_assign: ["veduci_servisu","dispecer_servisu"]   // priraďovanie v Pláne servisu
plan_quick_events: ["veduci_servisu","dispecer_servisu"]  // Pohotovosť/Dovolenka/PN/Služba/Udalosť
technician_add/edit/archive: ["veduci_servisu"]
technician_delete: []            // len admin
protocol_write: ["technik"]      // + admin vždy
backup_export/import, user_admin, view_as_role: []  // len admin
documents_edit: ["veduci_pozicovne","dispecer_pozicovne"]  // rámcové zmluvy, blacklist
```

Dôležitá výnimka v Pláne servisu: kliknutie na **prázdny** deň vyžaduje
`plan_assign`, ale kliknutie na deň, kde **už niečo je** (otvorenie na
prezretie/napísanie protokolu), je povolené každému — samotné okno
(`AssignSlotModal`) si už vnútri správne stráži, kto môže čo upravovať
(len `protocol_write` dovoľuje Protokol/Meranie VTZ/Foto, len `plan_assign`
dovoľuje Upraviť/Zmazať/Pridať).

**"Zobraziť ako"** (admin-only) — dočasne si appku pozrieť ako iná rola,
nemení skutočnú rolu v DB, používa sa cez `effectiveUser` (odvodený od
`currentUser` + `viewAsRole`).

**Landing page podľa role** — po prihlásení appka automaticky prepne na
`servis` pre veduci_servisu/dispecer_servisu/technik, inak `poziciovna`
(`ROLE_DEFAULT_MODULE`, spúšťa sa raz cez `useRef` flag).

## Dátový model (kľúče v `app_data`)

- `machines` — stroje požičovne (code, type, depo, revizia, uradnaSkuska,
  trackRevisions, trackUradnaSkuska, archived)
- `drivers` — šoféri (name, phone, email, depo, archived)
- `jobs` — zákazky požičovne (machineId, driverId, returnDriverId,
  fromDepo, toLocation, customer, customerEmail, obchodnik, cisloZmluvy,
  startDate, endDate, status, notes, checkerId — POZOR: checkerId sa už
  reálne nepoužíva, checker sa počíta automaticky z `depoCheckers`)
- `technicians` — technici (name, skratka, spz, depo, phone, email, archived)
- `assignments` — Plán servisu (technicianId, date, machineId ALEBO
  stroj/externyModel/externeSerioveCislo, umiestnenie, firma, poznamka,
  damageId, kind [pohotovost/dovolenka/pn/sluzba/udalost pre rýchle
  udalosti])
- `damages` — spoločná tabuľka pre poškodenia/externé/revízie/úradné
  skúšky, rozlíšené cez `type` (`poskodenie`/`externa`/`revizia`/
  `uradnaSkuska`), plus `resolved`, `technicianId`/`technicianIds`,
  `stav`, `opravaDatum`, `opravaKomentar`, `obchodnik` (uložený pri
  nahlásení, nie spätne)
- `weeklyDuty` — Služba na telefóne (technicianId, weekStart, weekEnd)
- `notifications` — zvonček (roles[], userName, title, message, readBy[])
- `transportSendLog` — sledovanie odoslaných mailov o prepravách
  (driverId, date, sentAt, transportIds[]) — proti duplicitám
- `customers` — databáza zákazníkov (firma, cisloOdberatela, kontakt,
  email, telefon) — autocomplete pri zakladaní zákaziek/externých
- `depoCheckers` — mapovanie depo → technicianId (kto je checker na danom
  depe), nastaviteľné v menu 🔧 Checkeri podľa depa
- `framoveZmluvy` — Požičovňa → Dokumenty → Zoznam rámcových zmlúv
- `blacklist` — Požičovňa → Dokumenty → BLACKLIST zákazníkov

`profiles` tabuľka (samostatná, nie cez app_data) — id, name, role, active,
spravovaná cez Supabase Auth + RLS, nie cez loadKey/saveKey.

## Navigácia (`module` / `view`)

**Požičovňa**: `dashboard` (Prehľad), `calendar` (Kalendár), `jobs`
(Zákazky), `prepravy`, `drivers` (Šoféri), `dokumenty` (dropdown).

**Servis**: `prehlad` (Prehľad — štatistika + presmerovanie, ako Požičovňa),
`plan` (Plán servisu — má vlastný toggle **Kalendár/Prehľad najbližších 5
dní** cez `planMode` state, zdieľaný filter technika/depa cez
`planTechnicianFilter`/`planDepoFilter`), `poskodenia`, `externe`,
`revizie`, `uradne_skusky`, `dokumenty` (dropdown).

**Dokumenty** (obe moduly) — `DOCUMENT_SUBTABS` objekt, dropdown v hlavičke
(`DocumentsTabButton`). Servis má 5 externých SharePoint odkazov. Požičovňa
má 2 skutočné interné tabuľky (rámcové zmluvy, blacklist — cez
`RecordsTableView`/`AddRecordModal`/`GenericCsvImportModal`) + 3 externé
odkazy.

## Prehľady (Dashboard-style štatistiky s presmerovaním)

Požičovňa Prehľad (`AlertsPanel`) aj Servis Prehľad (`ServisOverview`) sú
**čisté štatistické dlaždice** — žiadne inline zoznamy, žiadny mail rovno
tam, klik na dlaždicu presmeruje (`setModule`/`setView` +
`jobsQuickCategory` pre Zákazky). Detailné rozklikávacie zoznamy s mailom
sú teraz v samotnej záložke **Zákazky** (3 dlaždice: Po termíne/Končí
čoskoro do 5 dní/Bez šoféra, každá s modálnym rozbaľovacím zoznamom).

Servis Prehľad má navyše **"Rýchly prehľad — [mesiac]"** (kto má
Pohotovosť/Dovolenku/PN/Službu), presunuté sem z Plánu servisu.

**Dôležité**: revízie sa POČÍTAJÚ z `damages` (type="revizia", `overdue`
flag), NIE naživo z `machines[].revizia` — obe miesta (Prehľad aj záložka
Revízie) musia počítať rovnako, inak vznikne nesúlad (raz sa to stalo,
opravené).

## Notifikácie (zvonček)

Reálne (nie vizuálne) upozornenia, ukladané do `notifications`. Spúšťače:
- Nové poškodenie/externá zákazka → `dispecer_servisu`, `veduci_servisu`
- Oprava dokončená (stav "opravene") → `dispecer_pozicovne`,
  `veduci_pozicovne`, `veduci_servisu` + konkrétny obchodník (spárovaný
  podľa `profiles.name === damage.obchodnik`)

Admin vidí **všetky** notifikácie bez ohľadu na cieľové role (inak by
nevidel nič, keďže žiadna notifikácia netargetuje priamo "admin").

## Email systém

- `nameToEmail(name)` → `meno.priezvisko@matecoslovakia.sk` (odstráni
  diakritiku). Používa sa pre šoférov aj checkerov namiesto vyžadovania
  vyplneného emailu.
- `composeMail({to, cc, subject, body})` — univerzálna funkcia, prvýkrát
  sa opýta Web/Desktop (`MailChoiceModal`), potom si pamätá.
- **Kritické**: URL sa skladá cez `encodeURIComponent` (nie
  `URLSearchParams`, ktorý medzery kóduje ako `+` namiesto `%20`).
- Miesta odosielania: Prepravy (dnes/zajtra/pozajtra na osobu, so
  sledovaním duplicít cez `transportSendLog`), Zákazky "Končí čoskoro"
  (upozorniť zákazníka), "Email šoférovi" v Zákazkách.

## Checker podľa depa

Checker sa **nezadáva ručne** — automaticky sa vypočíta podľa depa
(`depoCheckers[depo]` → technicianId → meno), nastavuje sa v menu
**🔧 Checkeri podľa depa** (admin-only modal). Vývoz → depo odkiaľ, zvoz →
depo kam sa stroj vracia.

## Protokol (zabudovaný v appke)

`PROTOCOL_HTML_B64` — base64 zakódovaný `mateco-worksheet.html`, otvára sa
v iframe. Appka doň injektuje `window.__PROTOCOL_PREFILL__` (params) a
`window.__PROTOCOL_MACHINES__` (živý zoznam strojov appky, nie natvrdo
zabudovaný — appka posiela aktuálny zoznam pri každom otvorení).
`buildProtocolParams`/`protocolParamsFor` rozlišujú: skutočný stroj z
databázy vs. externý stroj (checkbox "Externý stroj" + model/sériové číslo
do samostatných polí).

Vedľa každého tlačidla "Vypísať protokol"/"Protokol" (4 miesta: hlavička,
AssignmentDetailModal, ServiceEventCard, AssignSlotModal) sú aj 2 externé
odkazy: **Záznam z merania pre VTZ EZ** (MS Forms) a **Odfotiť stroj
požičovne** (Netlify). Tieto sa NEZOBRAZUJÚ pri rýchlych udalostiach
(Pohotovosť a pod.) — len pri skutočných priradených zákazkách.

## Mobilná responzivita

CSS media query `@media (max-width: 720px)` v `GlobalStyle` — kompaktnejšie
odsadenia/fonty, `.resp-grid` kolabuje na 1 stĺpec, modály na celú
obrazovku, tabuľky s ukotveným prvým stĺpcom (`position:sticky`), gantty
majú CSS premenné `--gantt-name-col`/`--gantt-day-col`/`--gantt-plan-day-col`
menšie na mobile. Gantty (Kalendár, Plán servisu) používajú **samostatnú
mriežku na riadok** (nie jednu obrovskú spoločnú) — WebKit/iOS má bug so
`sticky` vo veľkých CSS Grid, toto ho obchádza. Text vo viacdňových
farebných blokoch v Kalendári "pláva" (`position:sticky` na vnútornom
elemente) s max-width obmedzenou podľa dĺžky bloku, nech neprerastá do
susedného bloku.

## Vzory kódu, na ktoré nadväzovať

- **Permission check**: `can(user, "kluc_akcie")` — `user` je zvyčajne
  `effectiveUser` (rešpektuje "Zobraziť ako").
- **Persist pattern**: `const persistX = useCallback((next) => { setX(next); saveKey("x", next); }, [])`
- **Modal pattern**: `<Modal title="..." onClose={...} wide?>...</Modal>`,
  vlastný state vo formulári, `canSave` boolean, `disabled={!canSave}`.
- **CSV import pattern**: `GenericCsvImportModal` (mapovanie stĺpcov,
  univerzálne pre rôzne polia) — použiť namiesto písania nového importu
  od nuly.
- Appka je **jeden súbor** — pri väčších úpravách používaj `str_replace` s
  dostatočne unikátnym kontextom; veľké `old_str`/`new_str` bloky občas
  nástroj orezal a stratil sa riadok s deklaráciou funkcie tesne pred/po
  bloku — vždy po väčšej úprave over `grep -c "^function X("` že
  deklarácia stále existuje presne raz.
- Po každej úprave: `npm install && VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run build`
  (dummy hodnoty stačia na build-time kontrolu), potom `rm -rf node_modules dist package-lock.json`,
  zip celého `mateco-project` priečinka, `present_files`.

## Čo zostáva neriešené (vedomé rozhodnutie, odložené)

- **Bod 7 pôvodného zoznamu — automatická denná záloha** (GitHub Actions
  s časovačom, sťahuje dáta zo Supabase a commituje ako JSON do repa) —
  zatiaľ nezrealizované, čaká na pokyn.
- Šofér/Technik "Vlastné" filtrovanie (vidieť len svoje záznamy) — riešené
  ručným filtrom podľa mena, nie automatickým prepojením účtu na
  konkrétneho šoféra/technika.

## Ako appku nasadiť / kde je čo

- GitHub repo → push do `main` → GitHub Actions build → GitHub Pages.
- `.env` (lokálne) / GitHub Secrets: `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`.
- Supabase SQL (RLS, profiles, trigger) sa nastavuje raz cez SQL Editor —
  presné skripty boli poslané v priebehu konverzácie ako samostatné
  `.sql` súbory (auth-setup, whitelist rolí, nezaradeny).
