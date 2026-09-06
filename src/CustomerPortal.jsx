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

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export default function CustomerPortal({ token }) {
  const [state, setState] = useState("loading"); // loading | ok | invalid | error
  const [data, setData] = useState(null);

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
                {data.depo && <div style={{ fontSize: 13, color: "#6b6b6b" }}>Depo {data.depo}</div>}
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

              <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginBottom: 8 }}>Odovzdávací protokol</div>
              {data.handoverDone ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #eee" }}>
                  <div style={{ fontSize: 13 }}>Prevzatie</div>
                  <div style={{ fontSize: 12, color: "#6b6b6b" }}>{fmtDate(data.handoverDate)}</div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#999", padding: "10px 0" }}>Zatiaľ nevypísaný.</div>
              )}
              {data.returnDone && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #eee" }}>
                  <div style={{ fontSize: 13 }}>Vrátenie</div>
                  <div style={{ fontSize: 12, color: "#6b6b6b" }}>{fmtDate(data.returnDate)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
