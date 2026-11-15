// Kto fotí 9 záberov (1.0.871 A1) a jedna kontrola za obe (A3) — rovnaké pravidlá ako DB private.photo_duty.
import { describe, it, expect } from "vitest";
import { _testFoto } from "./App.jsx";

const { photoDuty, departureInspection, inspectionPair } = _testFoto;
const done = (x) => ({ kind: "kontrolaStroja", resolved: true, machineId: "m1", checkerDate: "2026-11-10", ...x });

describe("photoDuty", () => {
  it("odchod: checker, ak kontrolu urobil; inak protokol; bez zákazníka obaja", () => {
    const a = [done({ id: "k", jobId: "j", phase: "vyvoz" })];
    expect(photoDuty({ id: "j", machineId: "m1" }, {}, "vyvoz", a, [])).toBe("checker");
    expect(photoDuty({ id: "j", machineId: "m1" }, {}, "vyvoz", [], [])).toBe("protokol");
    expect(photoDuty({ id: "j", machineId: "m1" }, { handoverCustomerAbsent: true }, "vyvoz", a, [])).toBe("oba");
    expect(photoDuty({ id: "j", machineId: "m1" }, { handoverPaperPhoto: "x" }, "vyvoz", [], [])).toBe("nikto");
    expect(photoDuty({ id: "j", machineId: "m1" }, { migratedWithoutHandover: true }, "vyvoz", [], [])).toBe("nikto");
  });
  it("odchod: kontrola neplatí, keď stroj medzitým odišiel na inú zákazku (A11)", () => {
    const a = [done({ id: "k", jobId: "j", phase: "vyvoz" })];
    const hp = [{ jobId: "b", machineId: "m1", handoverDone: true, handoverDate: "2026-11-11" }];
    expect(departureInspection({ id: "j", machineId: "m1" }, a, hp)).toBe(null);
    expect(photoDuty({ id: "j", machineId: "m1" }, {}, "vyvoz", a, hp)).toBe("protokol");
  });
  it("odchod: spoločná kontrola po vrátení predošlej zákazky platí (A3)", () => {
    const a = [done({ id: "k", jobId: "x", pairJobId: "j", phase: "vratenie" })];
    expect(photoDuty({ id: "j", machineId: "m1" }, {}, "vyvoz", a, [])).toBe("checker");
  });
  it("odchod: kontrola platí len pre stroj zákazky (výmena stroja po spoločnej kontrole, k65 terén S1)", () => {
    const a = [done({ id: "k", jobId: "x", pairJobId: "j", phase: "vratenie" })];
    expect(photoDuty({ id: "j", machineId: "m2" }, {}, "vyvoz", a, [])).toBe("protokol");
  });
  it("odchod: neskorší odchod stroja na inú zákazku kontrolu spätne nezruší (k65 požičovňa S2)", () => {
    const a = [done({ id: "k", jobId: "j", phase: "vyvoz" })];
    const hp = [{ jobId: "j", machineId: "m1", handoverDone: true, handoverDate: "2026-11-11" }, { jobId: "b", machineId: "m1", handoverDone: true, handoverDate: "2026-11-20" }];
    expect(departureInspection({ id: "j", machineId: "m1" }, a, hp)).toBe(a[0]);
    expect(departureInspection({ id: "j", machineId: "m1" }, a, [{ ...hp[0], handoverDate: "2026-11-21" }, hp[1]])).toBe(null);
  });
  it("návrat: šofér; checker pri osobnom vrátení, zvoze bez fotiek a papierovom protokole", () => {
    expect(photoDuty({}, {}, "vratenie")).toBe("protokol");
    expect(photoDuty({ selfReturn: true }, {}, "vratenie")).toBe("checker");
    expect(photoDuty({ selfReturn: true }, { returnCustomerAbsent: true }, "vratenie")).toBe("protokol");
    expect(photoDuty({}, { returnNoPhotosReason: "Tma alebo zlé počasie", returnCustomerAbsent: true }, "vratenie")).toBe("checker");
    expect(photoDuty({}, { returnPaperPhoto: "x" }, "vratenie")).toBe("checker");
  });
});

describe("inspectionPair (A3)", () => {
  const ret = { id: "r", kind: "kontrolaStroja", phase: "vratenie", jobId: "x", machineId: "m1", technicianId: "t" };
  const dep = { id: "d", kind: "kontrolaStroja", phase: "vyvoz", jobId: "y", machineId: "m1", technicianId: "t" };
  const hp = [{ jobId: "x", returnDone: true }];
  it("spojí otvorenú kontrolu po vrátení a pred vývozom toho istého stroja a checkera", () => {
    expect(inspectionPair(dep, [ret, dep], hp)).toEqual({ ret, dep });
    expect(inspectionPair(ret, [ret, dep], hp)).toEqual({ ret, dep });
  });
  it("nespojí: hotová po vrátení, iný checker, stroj nevrátený, stroj už odišiel", () => {
    expect(inspectionPair(dep, [{ ...ret, resolved: true }, dep], hp)).toBe(null);
    expect(inspectionPair(dep, [{ ...ret, technicianId: "u" }, dep], hp)).toBe(null);
    expect(inspectionPair(dep, [ret, dep], [])).toBe(null);
    expect(inspectionPair(dep, [ret, dep], [...hp, { jobId: "y", handoverDone: true }])).toBe(null);
  });
});
