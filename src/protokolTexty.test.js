import { describe, it, expect } from "vitest";
import * as T from "./protokolTexty.js";

// Pôvodné slovenské texty (App.jsx 1.0.871 pred presunom) — tlač sa nesmie zmeniť ani o znak.
const SK_CHECKLIST = [
  "Technický stav zariadenia", "Čistota stroja", "Zaškolenie obsluhy", "Nabitie akumulátorov", "Ovládací pult a ovládanie zariadenia",
  "Núdzové ovládanie zariadenia", "Stav náplní (olej, elektrolyt, nafta)", "Nabíjačka a pripojovací kábel", "Podložky pod podperné nohy", "Kľúče",
  "Revízie a denník zdvíhacieho zariadenia", "Návod na obsluhu", "Svetelný panel, rezervné koleso a predné koleso", "aDBlue - regenerácia motora",
];
const SK_RULES = [
  "V zmysle vyhlášky MPSVaR SR č. 508/2009, obsluhovať vyhradené zariadenie môžu len oprávnené osoby s príslušným osvedčením.",
  "Podpisom tohto protokolu prechádza zodpovednosť na nájomcu",
  "Pravidelne dobíjať akumulátory pracovnej plošiny",
  "Pravidelne kontrolovať a dopĺňať stav elektrolytu",
  "Pieskovanie z pracovnej plošiny je prísne zakázané",
  "Náklady na vyčistenie pracovnej plošiny znáša nájomca!",
];
const SK_VOP = 'Neoddeliteľnou súčasťou protokolu sú "VŠEOBECNÉ OBCHODNÉ PODMIENKY" (VOP) zverejnené na www.matecoslovakia.sk';

describe("texty protokolu SK/EN", () => {
  it("SK texty sú bez zmeny", () => {
    expect(T.HANDOVER_CHECKLIST_ITEMS).toEqual(SK_CHECKLIST);
    expect(T.HANDOVER_LEGAL_RULES).toEqual(SK_RULES);
    expect(T.HANDOVER_VOP_NOTE).toBe(SK_VOP);
    expect(T.PRIVACY_URL).toBe("https://www.matecoslovakia.sk/zasady-ochrany-osobnych-udajov/");
  });
  it("SK a EN majú rovnaký počet položiek, EN nie je prázdne", () => {
    expect(T.HANDOVER_CHECKLIST_ITEMS_EN).toHaveLength(T.HANDOVER_CHECKLIST_ITEMS.length);
    expect(T.HANDOVER_LEGAL_RULES_EN).toHaveLength(T.HANDOVER_LEGAL_RULES.length);
    expect([...T.HANDOVER_CHECKLIST_ITEMS_EN, ...T.HANDOVER_LEGAL_RULES_EN, ...Object.values(T.PROTOKOL_EN)].every((x) => x.trim())).toBe(true);
  });
  it("rozhodnutie 12. 11.: rental / lessee, nie hire", () => {
    const all = [...T.HANDOVER_CHECKLIST_ITEMS_EN, ...T.HANDOVER_LEGAL_RULES_EN, T.HANDOVER_VOP_NOTE_EN, ...Object.values(T.SHOT_LABEL_EN), ...Object.values(T.PROTOKOL_EN)].join(" | ");
    expect(all).not.toMatch(/\bhire/i);
    const L = T.protokolT(true);
    expect(L("Nájomca")).toBe("Lessee");
    expect(L("Za nájomcu")).toBe("For the lessee");
    expect(L("Za prenajímateľa")).toBe("For the lessor");
    expect(L("Nájomná zmluva č.")).toBe("Rental agreement no.");
    expect(L("Miesto prenájmu")).toBe("Place of rental");
    expect(L("Objednaná doba prenájmu")).toBe("Booked rental period");
    expect(L("Zásady prenájmu pracovnej plošiny")).toBe("Terms of rental of the access platform");
    expect(T.HANDOVER_LEGAL_RULES_EN[1]).toBe("By signing this protocol, responsibility passes to the lessee");
    expect(T.HANDOVER_LEGAL_RULES_EN[5]).toBe("The cost of cleaning the platform will be borne by the lessee!");
    expect(T.SHOT_LABEL_EN["Valce a piesty"]).toBe("Cylinders and pistons");
  });
  it("protokolT(false) vráti slovenský text bez zmeny, dátum po anglicky ako portál", () => {
    for (const k of Object.keys(T.PROTOKOL_EN)) expect(T.protokolT(false)(k)).toBe(k);
    expect(T.fmtDateEn("2026-09-05")).toBe("5 Sep 2026");
  });
});
