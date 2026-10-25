import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { BRANCHES, useSharedStore } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const BULAN: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

/** Parse "10 Okt 2026, 09:12" → epoch; gagal → 0 (tetap tampil, di akhir). */
function parseAt(at: string): number {
  const m = at.match(/(\d+)\s+(\w+)\s+(\d{4}),?\s+(\d+)[:.](\d+)/);
  if (!m) return 0;
  return new Date(Number(m[3]), BULAN[m[2]] ?? 0, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
}

type LedgerRow = {
  key: string;
  at: string;
  ts: number;
  fisik: boolean;
  event: string;
  ref: string;
  productId: string;
  branchId: string;
  qtyText: string;
  actor: string;
  trace: { requestId?: string; allocationId?: string; receiptId?: string; productId: string };
};

export default function OwnerMutasiPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("all");
  const [tipe, setTipe] = useState<"Semua" | "Fisik" | "Workflow">("Semua");
  const [traceKey, setTraceKey] = useState<string | null>(null);

  const rows = useMemo<LedgerRow[]>(() => {
    const out: LedgerRow[] = [];
    for (const m of store.mutations) {
      out.push({
        key: `M-${m.id}`,
        at: m.at,
        ts: parseAt(m.at),
        fisik: true,
        event: m.sumber,
        ref: m.ref,
        productId: m.productId,
        branchId: m.branchId,
        qtyText: m.qty > 0 ? `+${m.qty}` : `${m.qty}`,
        actor: m.actor,
        trace: { receiptId: m.sumber === "Penerimaan" ? m.ref : undefined, productId: m.productId },
      });
    }
    for (const r of store.requests) {
      out.push({
        key: `R-${r.id}`,
        at: r.at,
        ts: parseAt(r.at),
        fisik: false,
        event: "Pengajuan Dibuat",
        ref: r.id,
        productId: r.productId,
        branchId: r.branchId,
        qtyText: `minta ${r.qty}`,
        actor: r.actor,
        trace: { requestId: r.id, productId: r.productId },
      });
    }
    for (const d of store.distributions) {
      for (const l of d.lines) {
        out.push({
          key: `A-${d.id}-${l.productId}`,
          at: d.date,
          ts: parseAt(d.date),
          fisik: false,
          event: "Alokasi Direservasi",
          ref: d.id,
          productId: l.productId,
          branchId: d.branchId,
          qtyText: `alokasi ${l.qtyAlokasi}`,
          actor: d.actor ?? "Seed demo",
          trace: { requestId: d.requestId, allocationId: d.id, productId: l.productId },
        });
      }
    }
    out.sort((a, b) => b.ts - a.ts);
    return out
      .filter((r) => (loc === "all" ? true : r.branchId === loc))
      .filter((r) => (tipe === "Semua" ? true : r.fisik === (tipe === "Fisik")))
      .filter((r) => {
        const p = store.productOf(r.productId);
        return `${r.ref} ${r.event} ${p?.name ?? ""} ${p?.code ?? ""}`.toLowerCase().includes(q.toLowerCase());
      });
  }, [store, q, loc, tipe]);

  const trace = traceKey ? rows.find((r) => r.key === traceKey)?.trace : undefined;
  const traceReq = trace?.requestId ? store.requests.find((r) => r.id === trace.requestId) : undefined;
  const traceAllocs = trace
    ? store.distributions.filter(
        (d) => d.id === trace.allocationId || (trace.requestId && d.requestId === trace.requestId),
      )
    : [];
  const traceReceipts = trace
    ? store.receipts.filter(
        (r) =>
          r.id === trace.receiptId ||
          traceAllocs.some((d) => d.id === r.distributionId && r.productId === trace.productId),
      )
    : [];
  const traceMoves = trace
    ? store.mutations.filter(
        (m) =>
          traceReceipts.some((r) => r.id === m.ref) ||
          (m.productId === trace.productId && m.sumber === "Penjualan" && traceKey?.startsWith("M-")),
      )
    : [];

  return (
    <div className="page">
      <PageHeader
        overline="PENGAWASAN — MUTASI"
        title="Riwayat Mutasi"
        desc="Ledger gabungan kejadian nyata. Baris fisik mengubah saldo; baris workflow (pengajuan/alokasi) tidak."
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari referensi, kejadian, atau produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          {(["Semua", "Fisik", "Workflow"] as const).map((t) => (
            <Chip key={t} active={tipe === t} onClick={() => setTipe(t)}>
              {t}
            </Chip>
          ))}
        </div>
        <select className="select-pill" aria-label="Lokasi" value={loc} onChange={(e) => setLoc(e.target.value)}>
          <option value="all">Semua Lokasi</option>
          {BRANCHES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>WAKTU / ID</th>
              <th className="tt-center">KEJADIAN</th>
              <th>REFERENSI</th>
              <th>PRODUK</th>
              <th>LOKASI</th>
              <th className="tt-center">QTY</th>
              <th>AKTOR</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = store.productOf(r.productId);
              return (
                <tr key={r.key}>
                  <td>
                    <div className="tt-num" style={{ fontSize: 12.5 }}>
                      {r.key.startsWith("M-") ? r.key.slice(2) : r.ref}
                    </div>
                    <div className="tt-sub">{r.at}</div>
                  </td>
                  <td className="tt-center">
                    <StatusPill label={r.fisik ? (r.event === "Penjualan" ? "Keluar" : "Masuk") : "Diajukan"} dot={false} />
                    <div className="tt-sub">{r.event}</div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 12.5 }}>
                      {r.ref}
                    </div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name ?? r.productId}
                    </div>
                    <div className="tt-sub">{p?.code}</div>
                  </td>
                  <td>{BRANCHES.find((b) => b.id === r.branchId)?.name ?? r.branchId}</td>
                  <td className="tt-center tt-money">{r.qtyText}</td>
                  <td>{r.actor}</td>
                  <td className="tt-right">
                    <button className="link-action" onClick={() => setTraceKey(r.key)}>
                      Telusur
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-note">Tidak ada kejadian yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Workflow ≠ mutasi fisik: tidak ada baris saldo palsu · data demo
          </span>
        </div>
      </div>

      {trace ? (
        <div className="overlay" onClick={() => setTraceKey(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Telusur Rantai</h2>
                <div className="section-desc">pengajuan → alokasi → penerimaan → mutasi</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setTraceKey(null)}>
                <X size={18} />
              </button>
            </div>
            {traceReq ? (
              <div className="todo-row">
                <div className="todo-body">
                  <b>Pengajuan {traceReq.id}</b>
                  <span>
                    {traceReq.at} · {traceReq.actor} · minta {traceReq.qty}
                  </span>
                </div>
                <StatusPill label={traceReq.status} dot={false} />
              </div>
            ) : null}
            {traceAllocs.map((d) => (
              <div key={d.id} className="todo-row">
                <div className="todo-body">
                  <b>Alokasi {d.id}</b>
                  <span>
                    {d.date} · {d.actor ?? "seed"} · {d.lines.find((l) => l.productId === trace.productId)?.qtyAlokasi} unit · {d.status}
                  </span>
                </div>
              </div>
            ))}
            {traceReceipts.map((r) => (
              <div key={r.id} className="todo-row">
                <div className="todo-body">
                  <b>Penerimaan {r.id}</b>
                  <span>
                    {r.at} · {r.actor} · +{r.qty} unit
                  </span>
                </div>
              </div>
            ))}
            {traceMoves.slice(0, 5).map((m) => (
              <div key={m.id} className="todo-row">
                <div className="todo-body">
                  <b>Mutasi {m.id}</b>
                  <span>
                    {m.at} · {m.sumber} · {m.sebelum} → {m.sesudah}
                  </span>
                </div>
                <b style={{ fontSize: 13.5 }}>{m.qty > 0 ? `+${m.qty}` : m.qty}</b>
              </div>
            ))}
            {traceMoves.length === 0 && traceReceipts.length === 0 && traceAllocs.length === 0 && !traceReq ? (
              <div className="empty-note">Rantai tidak lengkap untuk baris ini.</div>
            ) : null}
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setTraceKey(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
