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

  async function handleSubmit() {
    setSending(true);
    setError(null);
    const ok = await onSubmit(type === "problem" ? message.trim() : null, type === "extension" ? endDate : null);
    setSending(false);
    if (ok) {
      setOpen(false);
      setMessage("");
      setEndDate("");
    } else {
      setError("Nepodarilo sa odoslať. Skúste to prosím neskôr.");
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
      return false;
    }
    const { data: fresh } = await supabase.rpc("get_portal_job", { p_token: token });
    if (fresh) setData(fresh);
    return true;
  }

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("get_portal_job", { p_token: token })
      .then(({ data: result, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("get_portal_job zlyhalo", error);
          setState("error");
          return;
        }
        if (!result) {
          setState("invalid");
          return;
        }
        setData(result);
        setState("ok");
      });
    return () => { cancelled = true; };
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

              <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginBottom: 4 }}>Odovzdávací protokol{data.protocolNumber ? ` č. ${data.protocolNumber}` : ""}</div>
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
              {data.returnDone && (
                <ProtocolPhase
                  title="Vrátenie"
                  date={data.returnDate}
                  statusKey="returnStatus"
                  noteKey="returnNote"
                  checklist={data.checklist}
                  custSig={data.returnCustomerSignature}
                  driverSig={data.returnDriverSignature}
                />
              )}
              <RequestHistory requests={data.requests} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
