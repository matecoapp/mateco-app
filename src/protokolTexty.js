// Texty protokolu o odovzdaní a prevzatí stroja — jedno miesto pre platformu (App.jsx) aj portál (CustomerPortal.jsx).
// SK texty sú doslovne z papierového vzoru (zhodné s pôvodnými v App.jsx) a nemenia sa — tlač musí vyzerať
// identicky pre daňovú kontrolu. EN je preklad (rozhodnutie 12. 11.: „rental“, nájomca = lessee); platí slovenská verzia.

// 14-bodový kontrolný zoznam — checklist v dátach je pole indexov bez vlastných popisiek, poradie sa nesmie meniť.
export const HANDOVER_CHECKLIST_ITEMS = [
  "Technický stav zariadenia",
  "Čistota stroja",
  "Zaškolenie obsluhy",
  "Nabitie akumulátorov",
  "Ovládací pult a ovládanie zariadenia",
  "Núdzové ovládanie zariadenia",
  "Stav náplní (olej, elektrolyt, nafta)",
  "Nabíjačka a pripojovací kábel",
  "Podložky pod podperné nohy",
  "Kľúče",
  "Revízie a denník zdvíhacieho zariadenia",
  "Návod na obsluhu",
  "Svetelný panel, rezervné koleso a predné koleso",
  "aDBlue - regenerácia motora",
];
export const HANDOVER_CHECKLIST_ITEMS_EN = [
  "Technical condition of the machine",
  "Cleanliness of the machine",
  "Operator briefing",
  "Battery charge",
  "Control panel and machine controls",
  "Emergency controls",
  "Fluid levels (oil, electrolyte, diesel)",
  "Charger and connecting cable",
  "Outrigger pads",
  "Keys",
  "Inspection records and lifting equipment logbook",
  "Operating manual",
  "Light bar, spare wheel and front wheel",
  "AdBlue – engine regeneration",
];
// Právny text z papierového vzoru — doslovne, nemení sa. Zobrazuje sa vo formulári aj v tlači.
export const HANDOVER_LEGAL_RULES = [
  "V zmysle vyhlášky MPSVaR SR č. 508/2009, obsluhovať vyhradené zariadenie môžu len oprávnené osoby s príslušným osvedčením.",
  "Podpisom tohto protokolu prechádza zodpovednosť na nájomcu",
  "Pravidelne dobíjať akumulátory pracovnej plošiny",
  "Pravidelne kontrolovať a dopĺňať stav elektrolytu",
  "Pieskovanie z pracovnej plošiny je prísne zakázané",
  "Náklady na vyčistenie pracovnej plošiny znáša nájomca!",
];
export const HANDOVER_LEGAL_RULES_EN = [
  "Under Decree No. 508/2009 of the Ministry of Labour, Social Affairs and Family of the Slovak Republic, designated equipment may only be operated by authorised persons holding the relevant certificate.",
  "By signing this protocol, responsibility passes to the lessee",
  "Charge the platform’s batteries regularly",
  "Check and top up the electrolyte level regularly",
  "Sandblasting from the platform is strictly prohibited",
  "The cost of cleaning the platform will be borne by the lessee!",
];
export const HANDOVER_VOP_NOTE = 'Neoddeliteľnou súčasťou protokolu sú "VŠEOBECNÉ OBCHODNÉ PODMIENKY" (VOP) zverejnené na www.matecoslovakia.sk';
export const HANDOVER_VOP_NOTE_EN = 'The "GENERAL TERMS AND CONDITIONS" published at https://www.matecoslovakia.sk/en/general-terms-and-conditions/ form an integral part of this protocol.';
export const HANDOVER_TRANSLATION_NOTE_EN = "This is a translation of the Slovak protocol. In case of any discrepancy, the Slovak version prevails.";
export const PRIVACY_URL = "https://www.matecoslovakia.sk/zasady-ochrany-osobnych-udajov/";
export const PRIVACY_URL_EN = "https://www.matecoslovakia.sk/en/privacy/";

// Popisy 9 záberov (podľa slovenského popisu — server ho posiela po slovensky).
export const SHOT_LABEL_EN = {
  "Ľavá strana": "Left side", "Pravá strana": "Right side", "Predná strana": "Front", "Zadná strana": "Rear",
  "Kôš / kabína s ovládaním": "Platform / cab with controls", "Motohodiny": "Hour meter", "Nosná časť (nožnice / ramená)": "Lifting structure (scissors / booms)",
  "Valce a piesty": "Cylinders and pistons", "Zdvihnutý stav": "Raised position", "Fotka poškodenia": "Damage photo",
};

// Hlavička, polia a pätka protokolu: slovenský text → anglický.
export const PROTOKOL_EN = {
  "Protokol": "Protocol",
  "PROTOKOL O ODOVZDANÍ A PREVZATÍ STROJA": "MACHINE HANDOVER AND ACCEPTANCE PROTOCOL",
  "Protokol č.": "Protocol no.",
  "Sériové číslo": "Serial number",
  "Typ / Názov": "Type / Model",
  "Nájomca": "Lessee",
  "Nájomná zmluva č.": "Rental agreement no.",
  "Miesto prenájmu": "Place of rental",
  "Objednaná doba prenájmu": "Booked rental period",
  "PREVZATIE": "HANDOVER",
  "VRÁTENIE": "RETURN",
  "Za nájomcu": "For the lessee",
  "Za prenajímateľa": "For the lessor",
  "Zákazník nebol prítomný — bez podpisu": "Customer not present — no signature",
  "— zatiaľ bez podpisu —": "— not signed yet —",
  "Zákazka bola prevzatá zákazníkom pred zavedením tohto systému — prevzatie nie je zdokumentované.": "The customer took over the machine before this system was introduced — the handover is not documented.",
  "Stroj je v prenájme — zatiaľ nebol vrátený.": "The machine is rented out — not returned yet.",
  "Zásady prenájmu pracovnej plošiny": "Terms of rental of the access platform",
  "Zásady ochrany osobných údajov": "Privacy policy",
  "IČO 36620114 · DIČ 2020083076 · IČ DPH SK2020083076": "Company ID (IČO) 36620114 · Tax ID (DIČ) 2020083076 · VAT ID SK2020083076",
  "Spoločnosť je zapísaná v Obchodnom registri Okresného súdu Banská Bystrica, vložka číslo 8576/S, oddiel s.r.o.": "The company is registered in the Commercial Register of the District Court of Banská Bystrica, Section: Sro, Insert No. 8576/S.",
  "ČSOB banka": "ČSOB",
};
// protokolT(en)("Nájomca") → „Lessee“ v angličtine, inak slovenský text bez zmeny.
export const protokolT = (en) => (sk) => (en && PROTOKOL_EN[sk]) || sk;

export const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// „2026-11-12“ → „12 Nov 2026“ (ako portál).
export function fmtDateEn(iso) {
  const [y, m, d] = String(iso || "").slice(0, 10).split("-");
  return y && MONTHS_EN[Number(m) - 1] && d ? `${Number(d)} ${MONTHS_EN[Number(m) - 1]} ${y}` : iso || "—";
}

// Papierový protokol (k65): namiesto prázdneho checklistu a „bez podpisu“ jedna veta — mená z papiera (odovzdal / prevzal),
// bez „prenajímateľa“ pri mene (odovzdávať mohol externý prepravca).
export function paperProtocolLine(ret, date, by, to, en) {
  const [y, m, d] = String(date || "").slice(0, 10).split("-");
  const day = en ? fmtDateEn(date) : y && m && d ? `${Number(d)}. ${Number(m)}. ${y}` : "—";
  return en
    ? `${ret ? "Return" : "Handover"} according to the paper protocol of ${day} — handed over by ${by || "—"}, received by ${to || "—"}; the original is held by the lessor.`
    : `${ret ? "Vrátenie" : "Odovzdanie"} podľa papierového protokolu z ${day} — odovzdal ${by || "—"}, prevzal ${to || "—"}; originál je u prenajímateľa.`;
}
