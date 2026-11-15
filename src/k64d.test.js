import { describe, it, expect } from "vitest";
import { _testK64d } from "./App.jsx";

const { mergeOnFresh, windowPatch, isLooseProtocol } = _testK64d;

describe("k64 d — súbeh", () => {
  it("nový problém s prepravou z fronty ostane, keď kancelária vyriešila predošlý (N7)", () => {
    const base = { id: "j", transportIssueNote: "zákazník nezdvíha", transportIssueAt: "2026-11-12T07:00:00Z", transportIssueBy: "Dana" };
    const item = { ...base, transportIssueNote: "zákazník nezdvíha\n08:15 Peter Šofér: brána zatvorená" };
    const fresh = { id: "j", transportIssueNote: null, transportIssueAt: null, transportIssueBy: null };
    let conflict = null;
    const out = mergeOnFresh(fresh, item, base, (f) => { conflict = f; });
    expect(conflict).toBe(null);
    expect(out.transportIssueNote).toBe("brána zatvorená"); // meno a čas len v transportIssueBy (k65 terén D4)
    expect(out.transportIssueBy).toBe("Peter Šofér");
    expect(out.transportIssueAt).toBeTruthy();
  });
  it("okno uloží len polia zmenené oproti snímke (N3)", () => {
    const snap = { place: "A", end: "2026-12-08", note: "" };
    expect(windowPatch(snap, { place: "B", end: "2026-12-08", note: "" })).toEqual({ place: "B" });
    expect(windowPatch(snap, { place: "A", end: "2026-12-08", note: null })).toEqual({});
  });
  it("protokol z úlohy Plánu bez tiketu je „bez priradenia“ (servis P5)", () => {
    expect(isLooseProtocol({ assignmentId: "a1" })).toBe(true);
    expect(isLooseProtocol({ damageId: "d1" })).toBe(false);
  });
});
