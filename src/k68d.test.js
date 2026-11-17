// Triedenie zoznamov kliknutím na hlavičku (1.0.873): zhoda drží predvolené poradie, prázdne na koniec, slovenská abeceda, čísla a dátumy číselne.
import { describe, it, expect } from "vitest";
import { _testK68d } from "./App.jsx";
const { applyListSort } = _testK68d;
const rows = [
  { id: "a", n: "Čierny", m: 10, d: "2026-11-02" },
  { id: "b", n: "Cesnak", m: 9, d: "" },
  { id: "c", n: "", m: null, d: "2026-10-30" },
  { id: "d", n: "Dub", m: 10, d: "2026-11-02" },
  { id: "e", n: "chata", m: 100, d: "2026-11-01" },
];
const cols = { n: (r) => r.n, m: (r) => r.m, d: (r) => r.d };
const ids = (a) => a.map((r) => r.id).join("");
describe("applyListSort", () => {
  it("bez voľby vráti predvolené poradie", () => { expect(applyListSort(rows, null, cols)).toBe(rows); expect(applyListSort(rows, { key: "x", dir: "asc" }, cols)).toBe(rows); });
  it("slovenská abeceda (c < č < d < ch), prázdne na konci oboma smermi", () => {
    expect(ids(applyListSort(rows, { key: "n", dir: "asc" }, cols))).toBe("badec");
    expect(ids(applyListSort(rows, { key: "n", dir: "desc" }, cols))).toBe("edabc");
  });
  it("čísla číselne, pri zhode predvolené poradie", () => {
    expect(ids(applyListSort(rows, { key: "m", dir: "asc" }, cols))).toBe("badec");
    expect(ids(applyListSort(rows, { key: "m", dir: "desc" }, cols))).toBe("eadbc");
  });
  it("dátumy, prázdny na konci", () => { expect(ids(applyListSort(rows, { key: "d", dir: "desc" }, cols))).toBe("adecb"); });
});
