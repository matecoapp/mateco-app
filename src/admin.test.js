// Administratíva: stĺpec „Zmena“ v Audit logu, popis v Koši, rola účtu ≠ karta.
import { describe, it, expect } from "vitest";
import { _testAdmin } from "./App.jsx";

const { auditChange, trashSubline, accountRoleDiffers } = _testAdmin;

describe("audit log — zmena", () => {
  it("stav poškodenia a zmenené pole z old_data (step113)", () => {
    const e = { action: "update", table_name: "damages", old_data: { technicianId: null, technicianIds: [] }, new_data: { popis: "x", technicianId: "e1", technicianIds: ["e1"] } };
    expect(auditChange(e, null, { e1: "Tomáš" })).toBe("stav: Nové → Pridelené · technik: — → Tomáš · technici (zmenené)");
    const done = { action: "update", table_name: "damages", old_data: { resolved: false }, new_data: { technicianId: "e1", resolved: true } };
    expect(auditChange(done, null, {})).toBe("stav: Pridelené → Opravené");
  });
  it("bez old_data porovná s predošlým zápisom; čas a interné polia preskočí", () => {
    const e = { action: "update", table_name: "employees", old_data: null, new_data: { role: "sofer", updatedAt: "2", _notify: 1 } };
    expect(auditChange(e, { role: "technik", updatedAt: "1" }, {})).toBe("rola: Technik → Šofér");
    expect(auditChange(e, null, {})).toBe("");
    expect(auditChange({ ...e, action: "insert" }, { role: "technik" }, {})).toBe("");
  });
  it("ID ukáže menom/kódom, úlohu a odkaz len ako pridané/zrušené, neznáme ID ako zmazané", () => {
    const e = { action: "update", table_name: "damages", old_data: { assignmentId: null, machineId: "m4" }, new_data: { type: "x", assignmentId: "r7av5jgauf9x", machineId: "m9" } };
    expect(auditChange(e, null, { m4: "S-105" })).toBe("úloha v pláne: pridaná · stroj: S-105 → (zmazaný záznam)");
    const j = { action: "update", table_name: "jobs", old_data: { publicToken: "6a6d5a3e-7c61-4952-9504-068f6c9f43f0" }, new_data: { publicToken: null } };
    expect(auditChange(j, null, {})).toBe("odkaz pre zákazníka: zrušený");
  });
  it("viac ako 3 zmeny skráti", () => {
    const e = { action: "update", table_name: "jobs", old_data: { a: 1, b: 1, c: 1, d: 1 }, new_data: { a: 2, b: 2, c: 2, d: 2 } };
    expect(auditChange(e, null, {})).toBe("a: 1 → 2 · b: 1 → 2 · c: 1 → 2 · +1");
  });
});

describe("kôš a roly", () => {
  it("popis pod kódom", () => {
    expect(trashSubline({ label: "S-105", originalData: { model: "Genie", location: "Prešov", popis: "a".repeat(45) } })).toBe(`Genie · Prešov · ${"a".repeat(40)}…`);
    expect(trashSubline({ label: "X", originalData: {} })).toBe("");
  });
  it("rola účtu ≠ karta (admin a chýbajúca karta sa nerátajú)", () => {
    expect(accountRoleDiffers({ role: "dispecer_pozicovne" }, { role: "sofer" })).toBe(true);
    expect(accountRoleDiffers({ role: "sofer" }, { role: "sofer" })).toBe(false);
    expect(accountRoleDiffers({ role: "admin" }, { role: "sofer" })).toBe(false);
    expect(accountRoleDiffers({ role: "sofer" }, undefined)).toBe(false);
  });
});
