// Spoločný komparátor zoznamov (1.0.869): najnovšie / najbližšie navrchu, pri rovnakom dni createdAt, nakoniec id.
import { describe, it, expect } from "vitest";
import { _testK61c } from "./App.jsx";
const { byKeys } = _testK61c;
const ids = (arr) => arr.map((x) => x.id);

describe("byKeys", () => {
  const rows = [
    { id: "zz1", date: "2026-11-07", createdAt: "2026-11-07T08:00:00.000Z" },
    { id: "aa2", date: "2026-11-07", createdAt: "2026-11-07T10:00:00.000+01:00" }, // = 09:00 Z
    { id: "mm3", date: "2026-11-06", createdAt: "2026-11-07T12:00:00.000Z" },
    { id: "bb4", date: "2026-11-07", createdAt: "2026-11-07T08:00:00.000Z" },
    { id: "cc5", date: "", createdAt: "2026-11-01T08:00:00.000Z" },
  ];
  it("história: najnovšie navrchu, rovnaký deň podľa createdAt (aj s +01:00), potom id; prázdny dátum na koniec", () => {
    expect(ids([...rows].sort(byKeys("-date", "-createdAt")))).toEqual(["aa2", "bb4", "zz1", "mm3", "cc5"]);
  });
  it("plán: najbližšie navrchu, rovnaký deň podľa createdAt, prázdny dátum na koniec", () => {
    expect(ids([...rows].sort(byKeys("date", "createdAt")))).toEqual(["mm3", "bb4", "zz1", "aa2", "cc5"]);
  });
  it("pri úplnej zhode vráti 0, inak je antisymetrický", () => {
    const c = byKeys("date");
    expect(c(rows[0], { ...rows[0] })).toBe(0);
    for (const a of rows) for (const b of rows) if (a !== b) expect(Math.sign(c(a, b))).toBe(-Math.sign(c(b, a)));
  });
  it("funkcia ako kľúč a [fn, -1] zostupne", () => {
    const r = [{ id: "a", s: "2026-11-05" }, { id: "b", d: "2026-11-04", s: "2026-11-01" }];
    expect(ids([...r].sort(byKeys((x) => x.d || x.s)))).toEqual(["b", "a"]);
    expect(ids([...r].sort(byKeys([(x) => x.d || x.s, -1])))).toEqual(["a", "b"]);
  });
  it("bez dátumu: slovenská abeceda a čísla v kóde", () => {
    const r = [{ id: "1", n: "Čierny" }, { id: "2", n: "Cesnak" }, { id: "3", n: "Dlhý" }, { id: "4", n: "S-115" }, { id: "5", n: "S-20" }];
    expect(ids([...r].sort(byKeys("n")))).toEqual(["2", "1", "3", "5", "4"]);
  });
  it("zmes čistého dátumu a času: čistý dátum = začiatok dňa", () => {
    const r = [{ id: "a", t: "2026-11-08" }, { id: "b", t: "2026-11-06" }, { id: "c", t: "2026-11-07T10:00:00Z" }];
    expect(ids([...r].sort(byKeys("t")))).toEqual(["b", "c", "a"]);
    expect(ids([...r].sort(byKeys("-t")))).toEqual(["a", "c", "b"]);
  });
});
