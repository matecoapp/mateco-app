import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Samostatná, ľahká stránka bez prihlásenia — zámerne NEIMPORTUJE App.jsx (obrovský
// súbor s celou appkou), aby zákazník nemusel sťahovať dispečerský bundle len kvôli
// prečítaniu stavu jednej zákazky. Vlastný Supabase klient (rovnaký anon kľúč, ktorý
// je aj v hlavnej appke — nie je to tajomstvo, bezpečnosť rieši RLS/RPC na serveri).
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Rovnaký zoznam ako HANDOVER_CHECKLIST_ITEMS v App.jsx — checklist v dátach je
// pole indexov bez vlastných popisiek, tie sa priraďujú podľa poradia. Ak sa
// zoznam v App.jsx zmení, treba ho zmeniť aj tu.
const HANDOVER_CHECKLIST_ITEMS = [
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

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

// Rovnaké právne texty a logo ako v App.jsx (openPrintableHandoverProtocol) —
// tlač z portálu musí vyzerať identicky s dispečerskou tlačou pre daňovú
// kontrolu. Ak sa zmenia v App.jsx, treba ich zmeniť aj tu.
const HANDOVER_LEGAL_RULES = [
  "Nájomca preberá zariadenie v riadnom technickom stave, spôsobilom na bezpečnú prevádzku, čo potvrdzuje svojím podpisom.",
  "Nájomca je povinný používať zariadenie výhradne na účel, na ktorý je určené, a v súlade s návodom na obsluhu.",
  "Akékoľvek poškodenie, poruchu alebo nehodu je nájomca povinný bezodkladne nahlásiť prenajímateľovi.",
  "Nájomca zodpovedá za škodu spôsobenú na zariadení počas doby nájmu, ak nepreukáže, že škodu nezavinil.",
  "Zariadenie sa vracia v stave, v akom bolo prevzaté, s prihliadnutím na obvyklé opotrebenie.",
];
const HANDOVER_VOP_NOTE = 'Neoddeliteľnou súčasťou protokolu sú "VŠEOBECNÉ OBCHODNÉ PODMIENKY" (VOP) zverejnené na www.matecoslovakia.sk';
const MATECO_LOGO_B64 = "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";

function protocolEsc(s) {
  return (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Rovnaká oficiálna šablóna papierového protokolu (dva stĺpce Prevzatie/Vrátenie,
// právny text, pätka s fakturačnými údajmi) ako dispečerská tlač v App.jsx
// (openPrintableHandoverProtocol) — zámerne bez tlačidiel Upraviť/QR/Poslať mailom,
// tie zákazník nepotrebuje. Otvára sa v novom okne, aby tlač nezávisela od CSS
// zvyšku portálovej stránky. Ak sa šablóna zmení v App.jsx, treba ju zmeniť aj tu.
function buildOfficialProtocolHtml(data) {
  const esc = protocolEsc;
  function sigBlock(dataUrl, label) {
    return `<div class="sigbox"><div class="siglabel">${esc(label)}</div>${dataUrl ? `<img src="${dataUrl}" class="sigimg">` : `<div class="signone">— zatiaľ bez podpisu —</div>`}</div>`;
  }
  function checklistCol(statusKey, noteKey) {
    return HANDOVER_CHECKLIST_ITEMS.map((label, i) => {
      const item = (data.checklist && data.checklist[i]) || {};
      const status = item[statusKey];
      const mark = status === "ok" ? "✓" : status === "problem" ? "✗" : "—";
      const markClass = status === "ok" ? "ok" : status === "problem" ? "bad" : "";
      const note = status === "problem" && item[noteKey] ? `<div class="itemnote">${esc(item[noteKey])}</div>` : "";
      return `<div class="checkrow"><span>${i + 1}. ${esc(label)}</span><span class="mark ${markClass}">${mark}</span></div>${note}`;
    }).join("");
  }
  return `<!DOCTYPE html>
<html lang="sk"><head><meta charset="UTF-8">
<title>Protokol ${esc(data.protocolNumber)}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap');
  .toolbar { text-align: center; margin: 0 0 10px; padding: 10px 0; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; font-family: 'Barlow', Arial, sans-serif; position: sticky; top: 0; z-index: 50; background: #e8e8e8; box-shadow: 0 2px 6px rgba(0,0,0,.08); }
  .btn { padding: 7px 14px; border-radius: 6px; font-family: 'Barlow', Arial, sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; border: 1px solid transparent; }
  .btn-accent { background: #E30613; color: #fff; }
  @media print { .toolbar { display: none !important; } }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; background: #e8e8e8; }
  .page { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; padding: 14mm 14mm 12mm 14mm; box-shadow: 0 2px 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; }
  .body-content { flex: 1; }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  .logo { height: 34px; width: auto; display: block; margin-top: 2px; }
  .head .titleblock { margin-top: 22px; }
  h1 { font-size: 18px; color: #E30613; margin: 0; text-align: right; }
  .sub { font-size: 12px; color: #555; margin-top: 4px; text-align: right; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 26px; margin-bottom: 18px; }
  .meta div span.l { color: #666; display: inline-block; min-width: 140px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; margin-bottom: 18px; }
  .colhead { font-weight: bold; font-size: 13px; border-bottom: 2px solid #E30613; padding-bottom: 5px; margin-bottom: 7px; }
  .checkrow { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #eee; }
  .mark { font-weight: bold; width: 18px; text-align: center; }
  .mark.ok { color: #2f7d32; }
  .mark.bad { color: #c62828; }
  .itemnote { font-size: 11px; color: #c62828; padding: 0 0 4px 4px; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
  .sigbox { border: 1px solid #ccc; border-radius: 4px; padding: 7px; }
  .siglabel { font-size: 11px; color: #666; margin-bottom: 4px; }
  .sigimg { max-width: 100%; height: 64px; }
  .signone { font-size: 11px; color: #999; height: 64px; display: flex; align-items: center; }
  .legal { margin-top: 20px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10.5px; color: #444; }
  .legal ol { margin: 4px 0; padding-left: 17px; }
  .legal li { margin-bottom: 2px; }
  .footer { margin-top: auto; padding-top: 12px; border-top: 1px solid #ccc; font-size: 11px; color: #555; line-height: 1.7; }
  .footer .legal { margin-top: 6px; padding-top: 0; border-top: none; color: #888; font-size: 10px; }
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; }
    @page { size: A4; margin: 0; }
  }
</style></head>
<body>
  <div class="toolbar"><button class="btn btn-accent" onclick="window.print()">🖨 Tlačiť / uložiť ako PDF</button></div>
  <div class="page">
  <div class="body-content">
  <div class="head">
    <img class="logo" src="data:image/png;base64,${MATECO_LOGO_B64}" alt="mateco">
    <div class="titleblock">
      <h1>PROTOKOL O ODOVZDANÍ A PREVZATÍ STROJA</h1>
      <div class="sub">Protokol č.: ${esc(data.protocolNumber)}</div>
    </div>
  </div>
  <div class="meta">
    <div><span class="l">Sériové číslo:</span>${esc(data.machineCode)}</div>
    <div><span class="l">Typ / Názov:</span>${esc(data.machineType)}</div>
    <div><span class="l">Nájomca:</span>${esc(data.customer)}</div>
    <div><span class="l">Nájomná zmluva č.:</span>${esc(data.cisloZmluvy)}</div>
    <div><span class="l">Miesto prenájmu:</span>${esc(data.address)}</div>
    <div><span class="l">Objednaná doba prenájmu:</span>${data.startDate ? fmtDate(data.startDate) : ""} – ${data.endDate ? fmtDate(data.endDate) : "—"}</div>
  </div>
  <div class="cols">
    <div>
      <div class="colhead">PREVZATIE (${data.handoverDate ? fmtDate(data.handoverDate) : "—"})</div>
      ${data.migratedWithoutHandover
        ? `<div style="font-size:10.5px;color:#666;padding:8px 0;">Zákazka bola prevzatá zákazníkom pred zavedením tohto systému — prevzatie nie je zdokumentované.</div>`
        : `${checklistCol("handoverStatus", "handoverNote")}
      <div class="sigs">
        ${sigBlock(data.handoverCustomerSignature, "Podpis nájomcu")}
        ${sigBlock(data.handoverDriverSignature, "Podpis prenajímateľa")}
      </div>`}
    </div>
    <div>
      <div class="colhead">VRÁTENIE ${data.returnDone ? `(${data.returnDate ? fmtDate(data.returnDate) : "—"})` : ""}</div>
      ${data.returnDone
        ? `${checklistCol("returnStatus", "returnNote")}
      <div class="sigs">
        ${sigBlock(data.returnCustomerSignature, "Podpis nájomcu")}
        ${sigBlock(data.returnDriverSignature, "Podpis prenajímateľa")}
      </div>`
        : `<div style="font-size:10.5px;color:#666;padding:8px 0;">Stroj je v prenájme — zatiaľ nebol vrátený.</div>`}
    </div>
  </div>
  <div class="legal">
    <strong>Zásady prenájmu pracovnej plošiny</strong>
    <ol>${HANDOVER_LEGAL_RULES.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
    <div>${esc(HANDOVER_VOP_NOTE)}</div>
  </div>
  </div>
  <div class="footer">
    mateco Slovakia s.r.o. · Strážska cesta 7892 · 960 01 Zvolen<br>
    T +421 (0)45 5410763 · www.matecoslovakia.sk · info@matecoslovakia.sk<br>
    IČO 36620114 · DIČ 2020083076 · IČ DPH SK2020083076 · ČSOB banka · IBAN SK51 7500 0000 0040 1776 6094 · SWIFT CEKO SKBX
    <div class="legal">Spoločnosť je zapísaná v Obchodnom registri Okresného súdu Banská Bystrica, vložka číslo 8576/S, oddiel s.r.o.</div>
  </div>
  </div>
</body></html>`;
}

function ProtocolPhase({ title, date, statusKey, noteKey, checklist, custSig, driverSig }) {
  return (
    <div style={{ borderTop: "1px solid #eee", paddingTop: 12, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6b6b6b" }}>{fmtDate(date)}</div>
      </div>
      <div style={{ marginBottom: 10 }}>
        {HANDOVER_CHECKLIST_ITEMS.map((label, i) => {
          const item = (checklist && checklist[i]) || {};
          const status = item[statusKey];
          const mark = status === "ok" ? "✓" : status === "problem" ? "✗" : "—";
          const markColor = status === "ok" ? "#2f7d32" : status === "problem" ? "#c62828" : "#bbb";
          const note = status === "problem" && item[noteKey] ? item[noteKey] : null;
          return (
            <div key={i} style={{ padding: "4px 0", borderBottom: i < HANDOVER_CHECKLIST_ITEMS.length - 1 ? "1px solid #f2f2f2" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span>{label}</span>
                <span style={{ color: markColor, fontWeight: 700 }}>{mark}</span>
              </div>
              {note && <div style={{ fontSize: 11.5, color: "#c62828", marginTop: 2 }}>{note}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 6, padding: 6 }}>
          <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>Podpis nájomcu</div>
          {custSig ? <img src={custSig} alt="Podpis nájomcu" style={{ width: "100%", height: 50, objectFit: "contain" }} /> : <div style={{ fontSize: 11, color: "#bbb", height: 50, display: "flex", alignItems: "center" }}>— bez podpisu —</div>}
        </div>
        <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 6, padding: 6 }}>
          <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>Podpis prenajímateľa</div>
          {driverSig ? <img src={driverSig} alt="Podpis prenajímateľa" style={{ width: "100%", height: 50, objectFit: "contain" }} /> : <div style={{ fontSize: 11, color: "#bbb", height: 50, display: "flex", alignItems: "center" }}>— bez podpisu —</div>}
        </div>
      </div>
    </div>
  );
}

const PORTAL_REQUEST_STATUS_LABEL = {
  pending: { label: "Čaká na vybavenie", color: "#b07e00", bg: "#fff8e1" },
  in_progress: { label: "V riešení", color: "#b07e00", bg: "#fff8e1" },
  approved: { label: "Schválené", color: "#27500A", bg: "#eaf3de" },
  resolved: { label: "Vyriešené", color: "#27500A", bg: "#eaf3de" },
  rejected: { label: "Zamietnuté", color: "#c62828", bg: "#fdecea" },
};

function RequestForm({ type, jobLocked, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  if (jobLocked) {
    return (
      <div style={{ fontSize: 12.5, color: "#6b6b6b", padding: "8px 0" }}>
        {type === "problem" ? "Problém je už nahlásený, čaká na vybavenie." : "Žiadosť o predĺženie už čaká na vybavenie."}
      </div>
    );
  }

  const REASON_LABEL = {
    already_open: "Už máte odoslanú žiadosť, ktorá čaká na vybavenie.",
    missing_message: "Popíšte, prosím, čo sa deje.",
    missing_date: "Zvoľte, prosím, dátum.",
    invalid_token: "Tento odkaz už nie je platný.",
  };

  async function handleSubmit() {
    setSending(true);
    setError(null);
    const reason = await onSubmit(type === "problem" ? message.trim() : null, type === "extension" ? endDate : null);
    setSending(false);
    if (reason === true) {
      setOpen(false);
      setMessage("");
      setEndDate("");
    } else {
      setError(REASON_LABEL[reason] || "Nepodarilo sa odoslať. Skúste to prosím neskôr.");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #B3131D", background: "#fff", color: "#B3131D", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
      >
        {type === "problem" ? "Nahlásiť problém so strojom" : "Požiadať o predĺženie"}
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 10 }}>
      {type === "problem" ? (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Čo presne sa deje…"
          style={{ width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 13, padding: 8, borderRadius: 4, border: "1px solid #ccc", marginBottom: 8 }}
        />
      ) : (
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: 8, borderRadius: 4, border: "1px solid #ccc", marginBottom: 8 }}
        />
      )}
      {error && <div style={{ fontSize: 12, color: "#c62828", marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={sending || (type === "problem" ? !message.trim() : !endDate)}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "none", background: "#B3131D", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "Odosielam…" : "Odoslať"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", color: "#3d3d3d", fontSize: 13, cursor: "pointer" }}
        >
          Zrušiť
        </button>
      </div>
    </div>
  );
}

function RequestHistory({ requests }) {
  if (!requests || requests.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginBottom: 6 }}>Vaše žiadosti</div>
      {requests.map((r, i) => {
        const st = PORTAL_REQUEST_STATUS_LABEL[r.status] || PORTAL_REQUEST_STATUS_LABEL.pending;
        return (
          <div key={i} style={{ border: "1px solid #eee", borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                {r.type === "problem" ? "Nahlásený problém" : `Žiadosť o predĺženie do ${fmtDate(r.requestedEndDate)}`}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>{st.label}</span>
            </div>
            {r.type === "problem" && <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2 }}>{r.message}</div>}
            {r.responseNote && <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2 }}>{r.responseNote}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function CustomerPortal({ token }) {
  const [state, setState] = useState("loading"); // loading | ok | invalid | error
  const [data, setData] = useState(null);

  async function submitRequest(message, requestedEndDate) {
    const type = requestedEndDate ? "extension" : "problem";
    const { data: result, error } = await supabase.rpc("submit_portal_request", {
      p_token: token,
      p_type: type,
      p_message: message,
      p_requested_end_date: requestedEndDate || null,
    });
    if (error || !result?.ok) {
      console.error("submit_portal_request zlyhalo", error, result);
      return result?.reason || "error";
    }
    const { data: fresh } = await supabase.rpc("get_portal_job", { p_token: token });
    if (fresh) setData(fresh);
    return true;
  }

  // Statická stránka bez prihlásenia nemá prístup k Supabase Realtime (tabuľky
  // jobs/portal_requests majú RLS len pre prihlásených zamestnancov) — dispečerova
  // zmena (schválenie predĺženia, odpoveď na hlásenie) by sa tu inak objavila až
  // po manuálnom obnovení stránky. Namiesto toho stránka periodicky dočíta stav
  // znova (a aj hneď po návrate na kartu, keby ju mal zákazník dlho otvorenú
  // v inej záložke).
  useEffect(() => {
    let cancelled = false;
    function refetch(showLoading) {
      if (showLoading) setState("loading");
      supabase
        .rpc("get_portal_job", { p_token: token })
        .then(({ data: result, error }) => {
          if (cancelled) return;
          if (error) {
            console.error("get_portal_job zlyhalo", error);
            if (showLoading) setState("error");
            return;
          }
          if (!result) {
            if (showLoading) setState("invalid");
            return;
          }
          setData(result);
          setState("ok");
        });
    }
    refetch(true);
    const interval = setInterval(() => refetch(false), 20000);
    function onVisible() {
      if (document.visibilityState === "visible") refetch(false);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0f0", fontFamily: "'Barlow', Arial, sans-serif" }}>
      <header style={{ background: "#E30613", padding: "10px 16px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
          mateco
          <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.85, marginLeft: 10 }}>Stav vašej zákazky</span>
        </div>
      </header>
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "16px 14px 40px" }}>
        {state === "loading" && (
          <div style={{ textAlign: "center", padding: 40, color: "#6b6b6b" }}>Načítavam…</div>
        )}
        {state === "invalid" && (
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, textAlign: "center", color: "#6b6b6b" }}>
            Tento odkaz už nie je platný.
          </div>
        )}
        {state === "error" && (
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, textAlign: "center", color: "#6b6b6b" }}>
            Nepodarilo sa načítať stav zákazky. Skúste to prosím neskôr.
          </div>
        )}
        {state === "ok" && data && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b6b6b" }}>Zákazka č.</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{data.code || "—"}</div>
                </div>
                <span
                  style={{
                    background: data.returnDone ? "#f4f4f4" : "#eaf3de",
                    color: data.returnDone ? "#3d3d3d" : "#27500A",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: 6,
                  }}
                >
                  {data.returnDone ? "Ukončené" : "Aktívny prenájom"}
                </span>
              </div>

              <div style={{ background: "#f9f9f9", borderRadius: 6, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {data.machineType || "Stroj"}
                </div>
                {data.machineCode && <div style={{ fontSize: 13, color: "#6b6b6b" }}>Sériové číslo {data.machineCode}</div>}
                {data.address && <div style={{ fontSize: 13, color: "#6b6b6b" }}>{data.address}</div>}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, background: "#f9f9f9", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#999" }}>Od</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(data.startDate)}</div>
                </div>
                <div style={{ flex: 1, background: "#f9f9f9", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#999" }}>Do</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(data.endDate)}</div>
                </div>
              </div>

              <div>
                <RequestHistory requests={data.requests} />

                {!data.returnDone && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <RequestForm
                      type="problem"
                      jobLocked={(data.requests || []).some((r) => r.type === "problem" && (r.status === "pending" || r.status === "in_progress"))}
                      onSubmit={submitRequest}
                    />
                    <RequestForm
                      type="extension"
                      jobLocked={(data.requests || []).some((r) => r.type === "extension" && r.status === "pending")}
                      onSubmit={submitRequest}
                    />
                  </div>
                )}

                <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginBottom: 4 }}>Kontakty</div>
                {data.salespersonName && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{data.salespersonName}</div>
                    {data.salespersonPhone && (
                      <div style={{ fontSize: 13 }}>
                        <a href={`tel:${data.salespersonPhone}`} style={{ color: "#B3131D", textDecoration: "none" }}>{data.salespersonPhone}</a>
                      </div>
                    )}
                    {data.salespersonEmail && (
                      <div style={{ fontSize: 13 }}>
                        <a href={`mailto:${data.salespersonEmail}`} style={{ color: "#B3131D", textDecoration: "none" }}>{data.salespersonEmail}</a>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#999", fontWeight: 600, marginBottom: 2 }}>Nahlasovanie porúch</div>
                <div style={{ fontSize: 13, marginBottom: 14 }}>
                  <div><a href="tel:+421905979484" style={{ color: "#B3131D", textDecoration: "none" }}>+421 905 979 484</a></div>
                  <div><a href="mailto:servis@matecoslovakia.sk" style={{ color: "#B3131D", textDecoration: "none" }}>servis@matecoslovakia.sk</a></div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: "#999", fontWeight: 600 }}>Odovzdávací protokol{data.protocolNumber ? ` č. ${data.protocolNumber}` : ""}</div>
                {data.handoverDone && !data.migratedWithoutHandover && (
                  <button
                    onClick={() => {
                      const w = window.open("", "_blank");
                      if (!w) return;
                      w.document.write(buildOfficialProtocolHtml(data));
                      w.document.close();
                    }}
                    style={{ border: "1px solid #B3131D", background: "#fff", color: "#B3131D", fontWeight: 600, fontSize: 12, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}
                  >
                    🖨️ Vytlačiť / uložiť ako PDF
                  </button>
                )}
              </div>
              {!data.handoverDone ? (
                <div style={{ fontSize: 13, color: "#999", padding: "10px 0" }}>Zatiaľ nevypísaný.</div>
              ) : data.migratedWithoutHandover ? (
                <div style={{ fontSize: 12.5, color: "#6b6b6b", padding: "10px 0" }}>
                  Stroj bol prevzatý pred zavedením tohto systému — prevzatie nie je zdokumentované.
                </div>
              ) : (
                <ProtocolPhase
                  title="Prevzatie"
                  date={data.handoverDate}
                  statusKey="handoverStatus"
                  noteKey="handoverNote"
                  checklist={data.checklist}
                  custSig={data.handoverCustomerSignature}
                  driverSig={data.handoverDriverSignature}
                />
              )}
              {data.handoverDone && (
                data.returnDone ? (
                  <ProtocolPhase
                    title="Vrátenie"
                    date={data.returnDate}
                    statusKey="returnStatus"
                    noteKey="returnNote"
                    checklist={data.checklist}
                    custSig={data.returnCustomerSignature}
                    driverSig={data.returnDriverSignature}
                  />
                ) : (
                  <div style={{ borderTop: "1px solid #eee", paddingTop: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Vrátenie</div>
                    <div style={{ fontSize: 12.5, color: "#6b6b6b" }}>Stroj je v prenájme — zatiaľ nebol vrátený.</div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
