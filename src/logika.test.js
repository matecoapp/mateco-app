// Automatické testy výpočtovej logiky platformy (npm test). Na GitHube bežia pred
// každým nasadením — keď niečo zlyhá, nová verzia sa nenasadí.
import { describe, it, expect } from "vitest";
import { _test } from "./App.jsx";

const { isRealISODate, rangesOverlap, jobFrom, jobTo, addDaysISO, parseImportDate, daysBetween, effectiveStatus, mergeOnFresh, mergeNotify, _verNum } = _test;

describe("dátumy", () => {
  it("rozpozná neexistujúci dátum", () => {
    expect(isRealISODate("2026-09-30")).toBe(true);
    expect(isRealISODate("2026-09-31")).toBe(false);
    expect(isRealISODate("2026-10-32")).toBe(false);
    expect(isRealISODate("2026-13-01")).toBe(false);
    expect(isRealISODate("2028-02-29")).toBe(true);
    expect(isRealISODate("2027-02-29")).toBe(false);
    expect(isRealISODate("")).toBe(false);
    expect(isRealISODate(null)).toBe(false);
    expect(isRealISODate("31.9.2026")).toBe(false);
  });
  it("pripočíta dni aj cez koniec mesiaca a roka", () => {
    expect(addDaysISO("2026-10-18", 14)).toBe("2026-11-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysISO("2026-10-25", 1)).toBe("2026-10-26"); // zmena času
  });
  it("počet dní medzi dátumami", () => {
    expect(daysBetween("2026-10-18", "2026-10-25")).toBe(7);
    expect(daysBetween("2026-10-25", "2026-10-18")).toBe(-7);
  });
});

describe("import CSV — dátumy", () => {
  it("bežné zápisy", () => {
    expect(parseImportDate("1. 3. 2027")).toBe("2027-03-01");
    expect(parseImportDate("01.03.2027")).toBe("2027-03-01");
    expect(parseImportDate("2027-03-01")).toBe("2027-03-01");
    expect(parseImportDate("03/04/2027")).toBe("2027-04-03");
    expect(parseImportDate("07-04-2027")).toBe("2027-04-07");
  });
  it("neexistujúci alebo prázdny dátum je prázdny", () => {
    expect(parseImportDate("31.09.2027")).toBe("");
    expect(parseImportDate("2027-02-30")).toBe("");
    expect(parseImportDate("")).toBe("");
    expect(parseImportDate(undefined)).toBe("");
  });
  it("čas za dátumom sa ignoruje, neznámy text nie je dátum", () => {
    expect(parseImportDate("3.11.2026 8:00")).toBe("2026-11-03");
    expect(parseImportDate("2026-11-03T08:00")).toBe("2026-11-03");
    expect(parseImportDate("2026-11-03T08:00:00Z")).toBe("2026-11-03");
    expect(parseImportDate("zajtra")).toBe("");
    expect(parseImportDate("2026")).toBe("2026-01-01");
  });
});

describe("kalendár — kolízie zákaziek", () => {
  it("prekryv a nadväzujúci prenájom", () => {
    expect(rangesOverlap("2026-10-01", "2026-10-10", "2026-10-05", "2026-10-15")).toBe(true);
    expect(rangesOverlap("2026-10-01", "2026-10-10", "2026-10-11", "2026-10-15")).toBe(false);
    // koniec jednej = začiatok druhej v ten istý deň (ráno zvoz, poobede vývoz) — nie je kolízia
    expect(rangesOverlap("2026-10-01", "2026-10-10", "2026-10-10", "2026-10-15")).toBe(false);
    expect(rangesOverlap("2026-10-10", "2026-10-15", "2026-10-01", "2026-10-10")).toBe(false);
    // zákazka bez konca koliduje so všetkým neskorším
    expect(rangesOverlap("2026-10-01", null, "2027-05-01", "2027-05-02")).toBe(true);
  });
  it("rozsah zákazky ráta prednávoz aj zvoz", () => {
    const j = { startDate: "2026-10-05", departureDate: "2026-10-04", endDate: "2026-10-10", pickupDate: "2026-10-12" };
    expect(jobFrom(j)).toBe("2026-10-04");
    expect(jobTo(j)).toBe("2026-10-12");
    expect(jobTo({ startDate: "2026-10-05" })).toBe(null);
  });
  it("stav zákazky podľa dňa", () => {
    const j = { startDate: "2026-10-05", endDate: "2026-10-10", status: "active" };
    expect(effectiveStatus(j, "2026-10-04")).toBe("planned");
    expect(effectiveStatus(j, "2026-10-10")).toBe("active");
    expect(effectiveStatus(j, "2026-10-11")).toBe("overdue");
    expect(effectiveStatus({ ...j, status: "completed" }, "2026-10-11")).toBe("completed");
  });
});

describe("ukladanie — zlúčenie s čerstvým záznamom", () => {
  it("moja zmena sa zlúči, cudzia ostane", () => {
    const base = { id: "j1", a: 1, b: 1 };
    const fresh = { id: "j1", a: 1, b: 2 }; // kolega zmenil b
    const mine = { id: "j1", a: 5, b: 1 }; // ja som zmenil a
    expect(mergeOnFresh(fresh, mine, base, () => {})).toEqual({ id: "j1", a: 5, b: 2 });
  });
  it("nový záznam a zmazaný záznam", () => {
    expect(mergeOnFresh(null, { id: "x" }, null, () => {})).toEqual({ id: "x" });
    expect(mergeOnFresh(null, { id: "x", a: 1 }, { id: "x" }, () => {})).toBe(null);
  });
  it("upozornenia k záznamu sa nezdvoja", () => {
    expect(mergeNotify([{ id: "n1" }], [{ id: "n1" }, { id: "n2" }]).map((n) => n.id)).toEqual(["n1", "n2"]);
    expect(mergeNotify(undefined, undefined)).toEqual([]);
  });
});

describe("verzie", () => {
  it("porovnanie čísel verzií", () => {
    expect(_verNum("1.0.817") > _verNum("1.0.816")).toBe(true);
    expect(_verNum("1.1.0") > _verNum("1.0.999")).toBe(true);
  });
});
