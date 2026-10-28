import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { useSharedStore } from "../../store/sharedStore";
import { requestState, requestStateLabel, type RequestState } from "../../store/requestStatus";
import { getSession } from "../../store/session";
import { Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

type StatusFilter = "Semua" | RequestState;

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "Semua", label: "Semua" },
  { id: "Diajukan", label: "Menunggu" },
  { id: "Sebagian", label: "Sebagian" },
  { id: "Dialokasikan", label: "Menunggu Diterima" },
  { id: "Selesai", label: "Selesai" },
  { id: "Ditolak", label: "Ditolak" },
];

export default function OwnerPengajuanPage() {
  const store = useSharedStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("Semua");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [notice, setNotice] = useState("");

  const baseRows = useMemo(
    () =>
      store.requests
        .filter((r) => (branch === "all" ? true : r.branchId === branch))
        .map((r) => {
          const alloc = store.allocatedForRequest(r.id, r.productId);
          const received = store.receivedForRequest(r.id, r.productId);
          return {
            r,
            alloc,
            received,
            sisa: store.outstandingForRequest(r.id, r.productId),
            state: requestState(r, r.qty, alloc, received),
          };
        }),
    [store, branch],
  );

  const rows = useMemo(
    () =>
      baseRows
        .filter(({ state }) => status === "Semua" || state === status)
        .filter(({ r }) => {
          const p = store.productOf(r.productId);
          return `${r.id} ${p?.name ?? ""} ${p?.code ?? ""}`.toLowerCase().includes(q.toLowerCase());
        }),
    [baseRows, status, q, store],
  );

  const awaiting = baseRows.filter(({ state }) => state === "Diajukan").length;
  const partly = baseRows.filter(({ state }) => state === "Sebagian").length;
  const allocated = baseRows.filter(({ state }) => state === "Dialokasikan").length;
  const done = baseRows.filter(({ state }) => state === "Selesai").length;
  const rejected = baseRows.filter(({ state }) => state === "Ditolak").length;

  const detail = detailId ? store.requests.find((r) => r.id === detailId) : undefined;
  const detailProduct = detail ? store.productOf(detail.productId) : undefined;
  const detailAlloc = detail ? store.allocatedForRequest(detail.id, detail.productId) : 0;
  const detailReceived = detail ? store.receivedForRequest(detail.id, detail.productId) : 0;
  const detailAvail = detailProduct ? store.availableToAllocate(detailProduct.id) : undefined;
  const detailStock = detail ? store.stockForBranch(detail.branchId).find((s) => s.productId === detail.productId) : undefined;
  const detailSisa = detail ? store.outstandingForRequest(detail.id, detail.productId) : 0;
  const detailPct = detail && detail.qty > 0 ? Math.min(100, Math.round((detailReceived / detail.qty) * 100)) : 0;
  const detailState = detail ? requestState(detail, detail.qty, detailAlloc, detailReceived) : "Diajukan";

  function openDetail(id: string) {
    setDetailId(id);
    setRejecting(false);
    setRejectReason("");
    setRejectError("");
  }

  function doReject() {
    if (!detail) return;
    const res = store.rejectRequest(detail.id, rejectReason, getSession()?.name ?? "Pemilik");
    if (!res.ok) {
      setRejectError(res.msg);
      return;
    }
    setDetailId(null);
    setNotice(res.msg);
  }

  return (
    <div className="page">
      <PageHeader
        overline="KEPUTUSAN — PERSETUJUAN PENGAJUAN"
        title="Persetujuan Pengajuan"
        desc="Daftar pengajuan masuk dari cabang. Tinjau sisa, lalu setujui lewat alokasi atau tolak dengan alasan."
      />

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <StatCard label="Menunggu Tinjauan" value={String(awaiting)} caption="Belum dialokasikan" tone="amber" />
        <StatCard
          label="Dialokasikan"
          value={String(partly + allocated)}
          caption={`${partly} sebagian · ${allocated} menunggu diterima`}
          tone="blue"
        />
        <StatCard label="Selesai" value={String(done)} caption="Barang sudah diterima" tone="green" />
      </div>

      {notice ? (
        <div className="notice notice-ok" role="status">
          {notice}
          <button className="icon-pill" aria-label="Tutup" onClick={() => setNotice("")} style={{ marginLeft: "auto" }}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <SearchBox placeholder="Cari ID pengajuan, produk, atau kode..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.id} active={status === f.id} onClick={() => setStatus(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <select className="select-pill" aria-label="Cabang" value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="all">Semua Cabang</option>
          {store.branches.filter((b) => b.type === "Cabang").map((b) => (
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
              <th>ID / WAKTU</th>
              <th>CABANG</th>
              <th>PRODUK</th>
              <th className="tt-right">DIMINTA</th>
              <th className="tt-right">DIALOKASIKAN</th>
              <th className="tt-right">DITERIMA</th>
              <th className="tt-right">SISA</th>
              <th>STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, alloc, received, sisa, state }) => {
              const p = store.productOf(r.productId);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="tt-num">{r.id}</div>
                    <div className="tt-sub">{r.at}</div>
                  </td>
                  <td>{store.branches.find((b) => b.id === r.branchId)?.name ?? r.branchId}</td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name}
                    </div>
                    <div className="tt-sub">
                      {p?.type} · {p?.code}
                    </div>
                  </td>
                  <td className="tt-right tt-money">{r.qty}</td>
                  <td className="tt-right tt-money">{alloc}</td>
                  <td className="tt-right tt-money">{received}</td>
                  <td className="tt-right tt-money">{sisa}</td>
                  <td>
                    <StatusPill label={requestStateLabel(state)} />
                  </td>
                  <td className="tt-right">
                    <button className="link-action" onClick={() => openDetail(r.id)}>
                      Tinjau
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-note">Belum ada pengajuan masuk pada filter ini.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            {rows.length} pengajuan · {awaiting} menunggu · {rejected} ditolak · sisa = diminta − dialokasikan
          </span>
        </div>
      </div>

      {detail && detailProduct ? (
        <div className="overlay" onClick={() => setDetailId(null)}>
          <div className="drawer" key={detail.id} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{detail.id}</h2>
                <div className="section-desc">
                  {detail.at} · {detail.actor}
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setDetailId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="trace-summary-card">
              <div className="trace-summary-top">
                <div>
                  <b>{detailProduct.name}</b>
                  <span>
                    {detailProduct.code} · {store.branches.find((b) => b.id === detail.branchId)?.name ?? detail.branchId}
                  </span>
                </div>
                <StatusPill label={requestStateLabel(detailState)} />
              </div>
              <div className="trace-summary-meta">
                <div className="trace-meta-item">
                  <span>Diminta</span>
                  <b>{detail.qty} unit</b>
                </div>
                <div className="trace-meta-item">
                  <span>Dialokasikan</span>
                  <b>{detailAlloc} unit</b>
                </div>
                <div className="trace-meta-item">
                  <span>Diterima</span>
                  <b>{detailReceived} unit</b>
                </div>
              </div>
            </div>

            <div className="trace-progress-box">
              <div className="trace-progress-head">
                <span>Penerimaan Barang</span>
                <b>{detailPct}% diterima</b>
              </div>
              <div className="top-bar">
                <span style={{ width: `${detailPct}%` }} />
              </div>
            </div>

            <div className="detail-rows">
              <div className="detail-row">
                <span>Produk</span>
                <b>
                  {detailProduct.name} ({detailProduct.code})
                </b>
              </div>
              <div className="detail-row">
                <span>Diminta / dialokasikan / diterima / sisa</span>
                <b>
                  {detail.qty} / {detailAlloc} / {detailReceived} / {detailSisa}
                </b>
              </div>
              <div className="detail-row">
                <span>Stok cabang (minimum)</span>
                <b>
                  {detailStock?.saldo ?? 0} ({detailStock?.minimum ?? 0})
                </b>
              </div>
              <div className="detail-row">
                <span>Stok pusat dapat dialokasikan</span>
                <b>
                  {detailAvail?.available}{" "}
                  <span className="tt-sub">
                    (dari {detailAvail?.onHand} unit, {detailAvail?.reserved} direservasi)
                  </span>
                </b>
              </div>
              <div className="detail-row">
                <span>Keterangan pengajuan</span>
                <b>{detail.note || "—"}</b>
              </div>
              {detail.status === "Ditolak" ? (
                <>
                  <div className="detail-row">
                    <span>Alasan penolakan</span>
                    <b>{detail.rejectedReason ?? "—"}</b>
                  </div>
                  <div className="detail-row">
                    <span>Ditolak oleh</span>
                    <b>
                      {detail.rejectedBy ?? "Pemilik"} · {detail.rejectedAt ?? "—"}
                    </b>
                  </div>
                </>
              ) : null}
            </div>

            {rejecting ? (
              <div className="drawer-form" style={{ padding: 0, border: 0 }}>
                {rejectError ? (
                  <div className="form-error" role="alert">
                    {rejectError}
                  </div>
                ) : null}
                <label className="afield">
                  <span>Alasan penolakan</span>
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="cth. Stok pusat dialihkan untuk kebutuhan cabang lain"
                    autoFocus
                  />
                </label>
                <div className="drawer-foot">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setRejecting(false);
                      setRejectError("");
                    }}
                  >
                    Batal
                  </button>
                  <button className="btn btn-danger" onClick={doReject}>
                    Tolak Pengajuan
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawer-foot">
                <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
                  Tutup
                </button>
                {detailState === "Diajukan" ? (
                  <button className="btn btn-ghost" onClick={() => setRejecting(true)}>
                    Tolak
                  </button>
                ) : null}
                {detailSisa > 0 && detailState !== "Ditolak" ? (
                  <button className="btn btn-primary" onClick={() => navigate(`/owner/alokasi?requestId=${detail.id}`)}>
                    Tentukan Alokasi
                    <ArrowRight size={16} />
                  </button>
                ) : detailState === "Ditolak" ? (
                  <span className="foot-note">Pengajuan ditolak.</span>
                ) : detailState === "Selesai" ? (
                  <span className="foot-note">Pengajuan selesai.</span>
                ) : (
                  <span className="foot-note">Menunggu penerimaan Admin cabang.</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
