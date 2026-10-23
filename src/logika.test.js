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

describe("štatistiky", () => {
  const { statBuckets, techFond, monthEndISO, numMth } = _test;
  it("obdobie na stĺpce: dni / týždne / mesiace", () => {
    expect(statBuckets("2026-10-01", "2026-10-20")).toHaveLength(20);
    const w = statBuckets("2026-08-01", "2026-10-20");
    expect(w[0]).toMatchObject({ s: "2026-08-01", e: "2026-08-02" }); // sobota → koniec týždňa v nedeľu
    expect(w[1]).toMatchObject({ s: "2026-08-03", e: "2026-08-09" });
    expect(w[w.length - 1].e).toBe("2026-10-20");
    expect(statBuckets("2026-01-01", "2026-10-20")).toHaveLength(10);
    expect(monthEndISO("2028-02-10")).toBe("2028-02-29");
  });
  it("fond technika: víkendy, sviatky, dovolenka a PN", () => {
    // október 2026: 22 pracovných dní (28. 10. nie je deň pracovného pokoja)
    expect(techFond("t1", "2026-10-01", "2026-10-31", [])).toEqual({ days: 22, hours: 176 });
    const a = [{ technicianId: "t1", kind: "dovolenka", date: "2026-10-05" }, { technicianId: "t1", kind: "pn", date: "2026-10-06" },
      { technicianId: "t1", kind: "dovolenka", date: "2026-10-10" }, { technicianId: "t2", kind: "dovolenka", date: "2026-10-07" }, { technicianId: "t1", kind: "pohotovost", date: "2026-10-08" }];
    expect(techFond("t1", "2026-10-01", "2026-10-31", a).hours).toBe(160); // sobota 10. 10. a cudzí/pohotovosť sa neodrátajú
    expect(techFond("t1", "2026-12-21", "2026-12-31", []).days).toBe(7); // 24. a 25. 12. sviatky (26. je sobota)
  });
  it("motohodiny z protokolu", () => {
    expect(numMth("1234,5")).toBe(1234.5);
    expect(numMth("")).toBe(null);
    expect(numMth("abc")).toBe(null);
  });
});

describe("kolo 30", () => {
  const { findMachineConflict, erpHours, erpTechKey } = _test;
  it("zákazka po termíne bez vrátenia drží stroj do dnes", () => {
    const t = new Date().toLocaleDateString("sv-SE");
    const late = { id: "a", machineId: "m", startDate: "2020-01-01", endDate: "2020-01-10", status: "active" };
    expect(findMachineConflict([late], [], "m", null, t, t)).toMatch(/po termíne/);
    expect(findMachineConflict([late], [], "m", null, addDaysISO(t, 1), addDaysISO(t, 3))).toBeNull(); // od zajtra nadväzuje
    expect(findMachineConflict([{ ...late, status: "completed" }], [], "m", null, t, t)).toBeNull();
    expect(findMachineConflict([{ ...late, returnDone: true }], [], "m", null, t, t)).toBeNull();
  });
  it("ERP hodiny kontroly: čiarka aj bodka, technik = kto ju urobil", () => {
    expect(erpHours({ workHours: "0,5" }) + erpHours({ workHours: 1.5 })).toBe(2);
    const techs = { t1: { id: "t1", name: "Tomáš" }, t3: { id: "t3", name: "Ivan" } };
    expect(erpTechKey({ technicianId: "t1", checkerBy: "Ivan" }, techs)).toBe("t3");
    expect(erpTechKey({ technicianId: "t1", checkerBy: "Niekto iný" }, techs)).toBe("t1");
  });
});

describe("rozhodnutia 23. 10.", () => {
  const { jobStillOut, machineRevDueBy, jobMthPair } = _test;
  const today = new Date().toISOString().slice(0, 10);
  it("stroj po termíne nevrátený ostáva vonku", () => {
    expect(jobStillOut({ startDate: addDaysISO(today, -20), endDate: addDaysISO(today, -3), status: "active" })).toBe(true);
    expect(jobStillOut({ startDate: addDaysISO(today, -20), endDate: addDaysISO(today, -3), status: "completed" })).toBe(false);
    expect(jobStillOut({ startDate: addDaysISO(today, -20), endDate: addDaysISO(today, 3), status: "active" })).toBe(false);
  });
  it("revízia, ktorá vyprší počas prenájmu", () => {
    const m = { revizia: addDaysISO(today, 10), trackRevisions: true };
    expect(machineRevDueBy(m, addDaysISO(today, 12))?.lbl).toBe("Revízia ZZ");
    expect(machineRevDueBy(m, addDaysISO(today, 5))).toBe(null);
  });
  it("motohodiny z kontroly checkera, protokol má prednosť", () => {
    const as = [{ kind: "kontrolaStroja", resolved: true, jobId: "j", phase: "vyvoz", mth: 100 }, { kind: "kontrolaStroja", resolved: true, jobId: "j", phase: "vratenie", mth: "110,5" }];
    expect(jobMthPair(as, "j", null)).toEqual([100, 110.5]);
    expect(jobMthPair(as, "j", { handoverMth: 90 })).toEqual([90, 110.5]);
  });
});
