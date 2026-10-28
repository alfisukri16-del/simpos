import { useMemo, useState } from "react";
import { ArrowRight, Check, Clock, Info, X } from "lucide-react";
import { useSharedStore } from "../../store/sharedStore";
import { requestState, requestStateLabel } from "../../store/requestStatus";
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

const PAGE = 10;

type LedgerRow = {
  key: string;
  at: string;
  ts: number;
  fisik: boolean;
  event: string;
  ref: string;
  productId: string;
  branchId: string;
  qty: number | null;
  qtyText: string;
  actor: string;
  trace: { mutationId?: string; requestId?: string; allocationId?: string; receiptId?: string; productId: string };
};

export default function OwnerMutasiPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("all");
  const [arah, setArah] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [page, setPage] = useState(1);
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
        qty: m.qty,
        qtyText: m.qty > 0 ? `+${m.qty}` : `${m.qty}`,
        actor: m.actor,
        trace: {
          mutationId: m.id,
          receiptId: m.sumber === "Penerimaan" ? m.ref : undefined,
          productId: m.productId,
        },
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
        qty: null,
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
          qty: null,
          qtyText: `alokasi ${l.qtyAlokasi}`,
          actor: d.actor ?? "Sistem",
          trace: { requestId: d.requestId, allocationId: d.id, productId: l.productId },
        });
      }
    }
    out.sort((a, b) => b.ts - a.ts);
    return out
      .filter((r) => (loc === "all" ? true : r.branchId === loc))
      .filter((r) =>
        arah === "Semua" ? true : arah === "Masuk" ? r.qty !== null && r.qty > 0 : r.qty !== null && r.qty < 0,
      )
      .filter((r) => {
        const p = store.productOf(r.productId);
        return `${r.ref} ${r.event} ${p?.name ?? ""} ${p?.code ?? ""}`.toLowerCase().includes(q.toLowerCase());
      });
  }, [store, q, loc, arah]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice((page - 1) * PAGE, page * PAGE);

  const selectedRow = traceKey ? rows.find((r) => r.key === traceKey) : undefined;
  const trace = selectedRow?.trace;
  const directMove = trace?.mutationId ? store.mutations.find((m) => m.id === trace.mutationId) : undefined;

  // Telusur dua arah: Pengajuan <-> Alokasi <-> Penerimaan <-> Mutasi
  const initialReceipt = trace?.receiptId ? store.receipts.find((r) => r.id === trace.receiptId) : undefined;
  const resolvedAllocId = trace?.allocationId ?? initialReceipt?.distributionId;
  const initialAlloc = resolvedAllocId ? store.distributions.find((d) => d.id === resolvedAllocId) : undefined;
  const resolvedRequestId = trace?.requestId ?? initialAlloc?.requestId;

  const traceReq = resolvedRequestId ? store.requests.find((r) => r.id === resolvedRequestId) : undefined;
  const traceReqAlloc = traceReq ? store.allocatedForRequest(traceReq.id, traceReq.productId) : 0;
  const traceReqReceived = traceReq ? store.receivedForRequest(traceReq.id, traceReq.productId) : 0;
  const traceAllocs = trace
    ? store.distributions.filter(
        (d) =>
          (resolvedAllocId && d.id === resolvedAllocId) ||
          (resolvedRequestId && d.requestId === resolvedRequestId),
      )
    : [];
  const traceReceipts = trace
    ? store.receipts.filter(
        (r) =>
          (trace.receiptId && r.id === trace.receiptId) ||
          traceAllocs.some((d) => d.id === r.distributionId && r.productId === trace.productId),
      )
    : [];
  const traceMoves = trace
    ? store.mutations.filter(
        (m) =>
          (directMove && m.id === directMove.id) ||
          traceReceipts.some((r) => r.id === m.ref && m.productId === trace.productId),
      )
    : [];

  const isDirectPhysical =
    Boolean(directMove) &&
    directMove?.sumber !== "Penerimaan" &&
    !traceReq &&
    traceAllocs.length === 0 &&
    traceReceipts.length === 0;

  const traceProduct = selectedRow ? store.productOf(selectedRow.productId) : undefined;
  const traceBranchName = selectedRow
    ? store.branches.find((b) => b.id === selectedRow.branchId)?.name ?? selectedRow.branchId
    : "";

  return (
    <div className="page">
      <PageHeader
        overline="PENGAWASAN — MUTASI"
        title="Riwayat Mutasi"
        desc="Catatan gabungan mutasi stok dan keputusan distribusi dari seluruh lokasi."
      />

      <div className="toolbar">
        <SearchBox
          placeholder="Cari referensi, keterangan, atau produk..."
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
        />
        <div className="toolbar-chips">
          {(["Semua", "Masuk", "Keluar"] as const).map((t) => (
            <Chip
              key={t}
              active={arah === t}
              onClick={() => {
                setArah(t);
                setPage(1);
              }}
            >
              {t}
            </Chip>
          ))}
        </div>
        <select
          className="select-pill"
          aria-label="Lokasi"
          value={loc}
          onChange={(e) => {
            setLoc(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Semua Lokasi</option>
          {store.branches.map((b) => (
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
              <th>TANGGAL</th>
              <th>PRODUK</th>
              <th>CABANG</th>
              <th className="tt-center">JENIS</th>
              <th className="tt-center">JUMLAH</th>
              <th>KETERANGAN</th>
              <th>AKTOR</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => {
              const p = store.productOf(r.productId);
              const jenis = r.fisik
                ? r.event === "Penjualan"
                  ? "Keluar"
                  : "Masuk"
                : r.event === "Pengajuan Dibuat"
                  ? "Pengajuan"
                  : "Alokasi";
              return (
                <tr key={r.key}>
                  <td>
                    <div className="tt-num" style={{ fontSize: 12.5 }}>
                      {r.at}
                    </div>
                    <div className="tt-sub">{r.key.startsWith("M-") ? r.key.slice(2) : r.ref}</div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name ?? r.productId}
                    </div>
                    <div className="tt-sub">{p?.code}</div>
                  </td>
                  <td>{store.branches.find((b) => b.id === r.branchId)?.name ?? r.branchId}</td>
                  <td className="tt-center">
                    <StatusPill label={jenis} dot={false} />
                  </td>
                  <td className="tt-center tt-money">{r.qtyText}</td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 12.5 }}>
                      {r.event}
                    </div>
                    <div className="tt-sub">{r.ref}</div>
                  </td>
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
            {view.length === 0 ? (
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
            Halaman {page} dari {pages} · {rows.length} kejadian · Masuk/Keluar hanya baris fisik;
            pengajuan dan alokasi tercatat sebagai keputusan.
          </span>
          <div className="foot-actions">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Sebelumnya
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {selectedRow && trace ? (
        <div className="overlay" onClick={() => setTraceKey(null)}>
          <div className="drawer" key={selectedRow.key} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Telusur Rantai</h2>
                <div className="section-desc">pengajuan → alokasi → penerimaan → mutasi</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setTraceKey(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Kartu ringkasan baris yang sedang ditelusuri */}
            <div className="trace-summary-card">
              <div className="trace-summary-top">
                <div>
                  <b>{traceProduct?.name ?? selectedRow.productId}</b>
                  <span>
                    {traceProduct?.code ?? selectedRow.productId} · {traceBranchName}
                  </span>
                </div>
                <StatusPill
                  label={
                    selectedRow.fisik
                      ? selectedRow.event === "Penjualan"
                        ? "Keluar"
                        : "Masuk"
                      : selectedRow.event === "Pengajuan Dibuat"
                        ? "Pengajuan"
                        : "Alokasi"
                  }
                  dot={false}
                />
              </div>
              <div className="trace-summary-meta">
                <div className="trace-meta-item">
                  <span>Referensi</span>
                  <b>{selectedRow.ref}</b>
                </div>
                <div className="trace-meta-item">
                  <span>Kejadian</span>
                  <b>{selectedRow.event}</b>
                </div>
                <div className="trace-meta-item">
                  <span>Kuantitas</span>
                  <b>{selectedRow.qtyText}</b>
                </div>
              </div>
            </div>

            <div className="mini-label">JEJAK RANTAI KEJADIAN</div>

            {isDirectPhysical && directMove ? (
              <>
                <div className="trace-chain">
                  <div className="trace-step is-done">
                    <span className="trace-dot">
                      <Check size={14} strokeWidth={2.6} />
                    </span>
                    <div className="trace-card">
                      <div className="trace-card-body">
                        <div className="trace-card-stage">SUMBER KEJADIAN LANGSUNG</div>
                        <b>
                          {directMove.sumber} · {directMove.ref}
                        </b>
                        <span>
                          {directMove.at} · oleh {directMove.actor}
                        </span>
                      </div>
                      <StatusPill label={directMove.arah === "IN" ? "Masuk" : "Keluar"} dot={false} />
                    </div>
                  </div>

                  <div className="trace-step is-done">
                    <span className="trace-dot">
                      <Check size={14} strokeWidth={2.6} />
                    </span>
                    <div className="trace-card">
                      <div className="trace-card-body">
                        <div className="trace-card-stage">MUTASI STOK FISIK</div>
                        <b>Mutasi {directMove.id}</b>
                        <span>
                          Saldo {directMove.sebelum} → <b>{directMove.sesudah} unit</b> ({traceBranchName})
                        </span>
                      </div>
                      <span className="trace-qty-badge">
                        {directMove.qty > 0 ? `+${directMove.qty}` : directMove.qty} unit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="notice">
                  <Info size={16} />
                  <span>
                    Kejadian <b>{directMove.sumber}</b> mengubah stok fisik secara langsung tanpa melalui rantai
                    pengajuan &amp; alokasi distribusi.
                  </span>
                </div>
              </>
            ) : (
              <div className="trace-chain">
                {/* Tahap 1: Pengajuan */}
                <div className={`trace-step ${traceReq ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceReq ? <Check size={14} strokeWidth={2.6} /> : "1"}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 1 · PENGAJUAN CABANG</div>
                      {traceReq ? (
                        <>
                          <b>Pengajuan {traceReq.id}</b>
                          <span>
                            {traceReq.at} · {traceReq.actor} · minta {traceReq.qty} unit
                          </span>
                        </>
                      ) : (
                        <>
                          <b>Tanpa Pengajuan Terkait</b>
                          <span>Alokasi dibuat langsung dari pusat tanpa referensi pengajuan cabang</span>
                        </>
                      )}
                    </div>
                    {traceReq ? (
                      <StatusPill
                        label={requestStateLabel(
                          requestState(traceReq, traceReq.qty, traceReqAlloc, traceReqReceived),
                        )}
                        dot={false}
                      />
                    ) : null}
                  </div>
                </div>

                {/* Tahap 2: Alokasi */}
                <div className={`trace-step ${traceAllocs.length > 0 ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceAllocs.length > 0 ? <Check size={14} strokeWidth={2.6} /> : <Clock size={14} />}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 2 · ALOKASI DISTRIBUSI</div>
                      {traceAllocs.length > 0 ? (
                        traceAllocs.map((d) => {
                          const line = d.lines.find((l) => l.productId === trace.productId);
                          return (
                            <div key={d.id} style={{ marginTop: 2 }}>
                              <b>Alokasi {d.id}</b>
                              <span>
                                {d.date} · {d.actor ?? "Sistem"} · {line?.qtyAlokasi ?? 0} unit · {d.status}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <b>Belum Ada Alokasi</b>
                          <span>Menunggu penentuan alokasi distribusi dari Pemilik</span>
                        </>
                      )}
                    </div>
                    {traceAllocs.length > 0 ? (
                      <span className="trace-qty-badge">
                        {traceAllocs.reduce(
                          (acc, d) => acc + (d.lines.find((l) => l.productId === trace.productId)?.qtyAlokasi ?? 0),
                          0,
                        )}{" "}
                        unit
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Tahap 3: Penerimaan */}
                <div className={`trace-step ${traceReceipts.length > 0 ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceReceipts.length > 0 ? <Check size={14} strokeWidth={2.6} /> : <Clock size={14} />}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 3 · PENERIMAAN CABANG</div>
                      {traceReceipts.length > 0 ? (
                        traceReceipts.map((r) => (
                          <div key={r.id} style={{ marginTop: 2 }}>
                            <b>Penerimaan {r.id}</b>
                            <span>
                              {r.at} · {r.actor} · +{r.qty} unit
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <b>Menunggu Penerimaan Fisik</b>
                          <span>Barang belum dikonfirmasi diterima oleh Admin Cabang</span>
                        </>
                      )}
                    </div>
                    {traceReceipts.length > 0 ? (
                      <span className="trace-qty-badge">
                        +{traceReceipts.reduce((acc, r) => acc + r.qty, 0)} unit
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Tahap 4: Mutasi Fisik */}
                <div className={`trace-step ${traceMoves.length > 0 ? "is-done" : "is-pending"}`}>
                  <span className="trace-dot">
                    {traceMoves.length > 0 ? <Check size={14} strokeWidth={2.6} /> : "4"}
                  </span>
                  <div className="trace-card">
                    <div className="trace-card-body">
                      <div className="trace-card-stage">TAHAP 4 · MUTASI STOK FISIK</div>
                      {traceMoves.length > 0 ? (
                        traceMoves.slice(0, 5).map((m) => (
                          <div key={m.id} style={{ marginTop: 2 }}>
                            <b>Mutasi {m.id}</b>
                            <span>
                              {m.at} · {m.sumber} · saldo {m.sebelum} → {m.sesudah}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <b>Belum Ada Mutasi Fisik</b>
                          <span>Stok fisik belum berubah sebelum penerimaan dikonfirmasi</span>
                        </>
                      )}
                    </div>
                    {traceMoves.length > 0 ? (
                      <span className="trace-qty-badge">
                        {traceMoves[0].qty > 0 ? `+${traceMoves[0].qty}` : traceMoves[0].qty} unit
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

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
