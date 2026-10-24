import { useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Plus, TriangleAlert, Truck, X } from "lucide-react";
import { BRANCHES, useSharedStore } from "../../store/sharedStore";
import { DEMO_OWNER } from "../../store/session";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function OwnerAlokasiPage() {
  const store = useSharedStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Menunggu Diterima" | "Diterima Sebagian" | "Diterima">("Semua");
  const [detailId, setDetailId] = useState<string | null>(null);

  // Form alokasi
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("cabang-padang");
  const [productId, setProductId] = useState("P-003");
  const [requestId, setRequestId] = useState(params.get("requestId") ?? "");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const keyRef = useRef("");

  const rows = useMemo(
    () =>
      store.distributions
        .filter((d) => (filter === "Semua" ? true : d.status === filter))
        .filter((d) => {
          const names = d.lines.map((l) => store.productOf(l.productId)?.name ?? "").join(" ");
          return `${d.id} ${names}`.toLowerCase().includes(q.toLowerCase());
        }),
    [store, q, filter],
  );

  const products = useMemo(
    () => store.products.filter((p) => p.status === "Aktif" && p.type !== "Aksesoris"),
    [store.products],
  );
  const avail = store.availableToAllocate(productId);
  const req = requestId ? store.requests.find((r) => r.id === requestId && r.productId === productId) : undefined;
  const outstanding = requestId ? store.outstandingForRequest(requestId, productId) : null;

  const start = (presetRequest?: string) => {
    setBranchId("cabang-padang");
    setProductId("P-003");
    setRequestId(presetRequest ?? params.get("requestId") ?? "");
    setQty("");
    setNote("");
    setError("");
    setDone(null);
    setBusy(false);
    keyRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
    setOpen(true);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    if (!/^[0-9]+$/.test(qty.trim())) {
      setBusy(false);
      setError("Jumlah alokasi harus bilangan bulat lebih dari 0 (tanpa titik, koma, atau minus).");
      return;
    }
    const r = store.createAllocation({
      requestId: requestId || undefined,
      branchId,
      productId,
      qty: Number(String(qty).replace(/[^0-9]/g, "")),
      note,
      actor: DEMO_OWNER.name,
      key: keyRef.current,
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.msg);
      return;
    }
    setDone(r.id ?? null);
    setParams({});
  };

  const detail = detailId ? store.distributions.find((d) => d.id === detailId) : undefined;

  return (
    <div className="page">
      <PageHeader
        overline="KEPUTUSAN — ALOKASI"
        title="Alokasi Distribusi"
        desc="Tentukan jumlah dari Pusat ke cabang. Alokasi = reservasi (mengurangi yang bisa dialokasikan), bukan pengurangan fisik stok pusat dan bukan penerimaan cabang."
        actions={
          <button className="btn btn-primary" onClick={() => start()}>
            <Plus size={16} />
            Buat Alokasi
          </button>
        }
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari ID alokasi atau nama produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          {(["Semua", "Menunggu Diterima", "Diterima Sebagian", "Diterima"] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <div className="notice">
        <Truck size={16} />
        Kapan stok pusat dikurangi (alokasi / kirim / terima) belum diputuskan — prototype ini tidak
        mendebit fisik pusat. Selisih terima vs alokasi dicatat, bukan dinormalisasi otomatis.
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>ID / TANGGAL</th>
              <th>TUJUAN</th>
              <th>PRODUK</th>
              <th className="tt-right">ALOKASI</th>
              <th className="tt-right">DITERIMA</th>
              <th>STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="tt-num">{d.id}</div>
                  <div className="tt-sub">
                    {d.date}
                    {d.requestId ? ` · ${d.requestId}` : " · alokasi awal"}
                  </div>
                </td>
                <td>{BRANCHES.find((b) => b.id === d.branchId)?.name ?? d.branchId}</td>
                <td>
                  {d.lines.map((l) => {
                    const p = store.productOf(l.productId);
                    return (
                      <div key={l.productId} className="tt-num" style={{ fontSize: 13 }}>
                        {p?.name} <span className="tt-sub">({p?.code})</span>
                      </div>
                    );
                  })}
                </td>
                <td className="tt-right tt-money">{d.lines.reduce((a, l) => a + l.qtyAlokasi, 0)}</td>
                <td className="tt-right tt-money">{d.lines.reduce((a, l) => a + l.qtyDiterima, 0)}</td>
                <td>
                  <StatusPill label={d.status} />
                </td>
                <td className="tt-right">
                  <button className="link-action" onClick={() => setDetailId(d.id)}>
                    Detail
                    <ArrowRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-note">Belum ada alokasi pada filter ini.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Alokasi baru muncul di Penerimaan Admin cabang tujuan · data demo</span>
        </div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {done ? (
              <>
                <div className="drawer-head">
                  <div>
                    <h2>Alokasi tercatat</h2>
                    <div className="section-desc">{done} · menunggu penerimaan Admin</div>
                  </div>
                  <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="notice notice-ok" role="status">
                  <CheckCircle2 size={16} />
                  Reservasi tercatat tepat satu kali. Stok fisik pusat dan cabang tidak berubah.
                </div>
                <div className="drawer-foot">
                  <button className="btn btn-primary" onClick={() => setOpen(false)}>
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="drawer-head">
                  <div>
                    <h2>Buat Alokasi</h2>
                    <div className="section-desc">Pusat → cabang · oleh {DEMO_OWNER.name}</div>
                  </div>
                  <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={submit} className="drawer-form" noValidate>
                  {error ? (
                    <div className="form-error" role="alert">
                      {error}
                    </div>
                  ) : null}
                  <label className="afield">
                    <span>Cabang tujuan</span>
                    <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                      {BRANCHES.filter((b) => b.type === "Cabang").map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="afield">
                    <span>Produk (frame / lensa)</span>
                    <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="afield">
                    <span>Pengajuan terkait (opsional)</span>
                    <select value={requestId} onChange={(e) => setRequestId(e.target.value)}>
                      <option value="">— Tanpa pengajuan —</option>
                      {store.requests
                        .filter((r) => r.productId === productId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.id} · diminta {r.qty} · sisa {store.outstandingForRequest(r.id, r.productId)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="detail-rows">
                    <div className="detail-row">
                      <span>Stok pusat on-hand</span>
                      <b>{avail.onHand}</b>
                    </div>
                    <div className="detail-row">
                      <span>Sudah direservasi</span>
                      <b>{avail.reserved}</b>
                    </div>
                    <div className="detail-row">
                      <span>Bisa dialokasikan</span>
                      <b>{avail.available}</b>
                    </div>
                    {req ? (
                      <div className="detail-row">
                        <span>Sisa pengajuan {req.id}</span>
                        <b>{outstanding}</b>
                      </div>
                    ) : null}
                  </div>
                  <label className="afield">
                    <span>Jumlah alokasi</span>
                    <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="cth. 4" />
                  </label>
                  <label className="afield">
                    <span>Catatan (opsional)</span>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. prioritas stok menipis" />
                  </label>
                  <div className="drawer-foot">
                    <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                      Batal
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                      {busy ? "Memproses..." : "Simpan Alokasi"}
                    </button>
                  </div>
                  {error ? (
                    <div className="form-error" role="alert" style={{ display: "flex", gap: 8 }}>
                      <TriangleAlert size={15} />
                      {error}
                    </div>
                  ) : null}
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}

      {detail ? (
        <div className="overlay" onClick={() => setDetailId(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{detail.id}</h2>
                <div className="section-desc">
                  {detail.date} · oleh {detail.actor ?? "Alokasi awal (seed demo)"}
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setDetailId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="detail-rows">
              <div className="detail-row">
                <span>Tujuan</span>
                <b>{BRANCHES.find((b) => b.id === detail.branchId)?.name}</b>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <StatusPill label={detail.status} />
              </div>
              {detail.lines.map((l) => {
                const p = store.productOf(l.productId);
                return (
                  <div key={l.productId} className="detail-row">
                    <span>{p?.name}</span>
                    <b>
                      alokasi {l.qtyAlokasi} · diterima {l.qtyDiterima}
                    </b>
                  </div>
                );
              })}
              {detail.requestId ? (
                <div className="detail-row">
                  <span>Pengajuan</span>
                  <b>{detail.requestId}</b>
                </div>
              ) : null}
              {detail.note ? (
                <div className="detail-row">
                  <span>Catatan</span>
                  <b>{detail.note}</b>
                </div>
              ) : null}
            </div>
            <div className="notice">
              <Truck size={16} />
              Penerimaan fisik dicatat Admin cabang — Owner tidak menandai diterima.
            </div>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
