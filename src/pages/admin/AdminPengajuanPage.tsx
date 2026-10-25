import { useMemo, useState, type FormEvent } from "react";
import { BellRing, CheckCircle2, FilePlus2, TriangleAlert, X } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminPengajuanPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [done, setDone] = useState(false);

  const options = useMemo(
    () =>
      store.products
        .filter((p) => p.status === "Aktif" && p.type !== "Aksesoris")
        .map((p) => ({ p, s: store.stockOf(p.id) })),
    [store],
  );

  const chosen = options.find((o) => o.p.id === productId);
  const qtyRaw = qty.trim();
  const qtyNum = /^[0-9]+$/.test(qtyRaw) ? Number(qtyRaw) : NaN;
  const low = chosen && chosen.s ? chosen.s.saldo <= chosen.s.minimum : false;

  const rows = useMemo(
    () =>
      store.requests.filter((r) => {
        const p = store.productOf(r.productId);
        return `${r.id} ${p?.name ?? ""} ${p?.code ?? ""}`.toLowerCase().includes(q.toLowerCase());
      }),
    [store, q],
  );

  const start = () => {
    setProductId(options[0]?.p.id ?? "");
    setQty("");
    setNote("");
    setError("");
    setPreview(false);
    setDone(false);
    setOpen(true);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError("Pilih produk terlebih dahulu.");
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      setError("Jumlah harus bilangan bulat lebih dari 0 (tanpa titik, koma, atau minus).");
      return;
    }
    if (!preview) {
      setPreview(true);
      return;
    }
    store.createRequest(productId, qtyNum, note.trim());
    setDone(true);
  };

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN — PENGAJUAN"
        title="Pengajuan Stok"
        desc={`Sampaikan kebutuhan barang ke Pemilik. Pengajuan tidak menambah stok — stok hanya berubah lewat penerimaan tercatat.`}
        actions={
          <button className="btn btn-primary" onClick={start}>
            <FilePlus2 size={16} />
            Ajukan Stok
          </button>
        }
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari ID pengajuan atau nama produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          <Chip active>Diajukan</Chip>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>ID / WAKTU</th>
              <th>PRODUK</th>
              <th className="tt-center">STOK SAAT INI</th>
              <th className="tt-center">QTY DIMINTA</th>
              <th className="tt-center">STATUS</th>
              <th>KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = store.productOf(r.productId);
              const s = store.stockOf(r.productId);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="tt-num">{r.id}</div>
                    <div className="tt-sub">{r.at}</div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name}
                    </div>
                    <div className="tt-sub">{p?.code}</div>
                  </td>
                  <td className="tt-center tt-money">
                    {s?.saldo ?? 0}
                    {s && s.saldo <= s.minimum ? (
                      <div className="tt-sub">menipis (min {s.minimum})</div>
                    ) : null}
                  </td>
                  <td className="tt-center tt-money">{r.qty}</td>
                  <td className="tt-center">
                    <StatusPill label={r.status} />
                  </td>
                  <td>
                    <span className="tt-sub" style={{ marginTop: 0 }}>
                      {r.note || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-note">Belum ada pengajuan. Buat pengajuan pertama lewat tombol di atas.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Persetujuan/penolakan oleh Pemilik belum final (PRD terbuka) · notifikasi tersimpan sebagai simulasi:
            {store.notices.length} antre
          </span>
        </div>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {done ? (
              <>
                <div className="drawer-head">
                  <div>
                    <h2>Pengajuan terkirim</h2>
                    <div className="section-desc">Tersimpan + notifikasi simulasi untuk Pemilik</div>
                  </div>
                  <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="notice notice-ok" role="status">
                  <CheckCircle2 size={16} />
                  Pengajuan tercatat di riwayat. Saldo stok tidak berubah.
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
                    <h2>{preview ? "Pratinjau Pengajuan" : "Ajukan Stok"}</h2>
                    <div className="section-desc">{DEMO_ADMIN.branch} → Pemilik (simulasi)</div>
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
                  {!preview ? (
                    <>
                      <label className="afield">
                        <span>Produk (frame / lensa cabang ini)</span>
                        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                          {options.map(({ p, s }) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.name} (stok {s?.saldo ?? 0}
                              {s && s.saldo <= s.minimum ? ", menipis" : ""})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="afield">
                        <span>Jumlah dibutuhkan</span>
                        <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="cth. 5" />
                      </label>
                      <label className="afield">
                        <span>Keterangan (opsional)</span>
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. permintaan pelanggan" />
                      </label>
                    </>
                  ) : (
                    <div className="detail-rows">
                      <div className="detail-row">
                        <span>Produk</span>
                        <b>{chosen?.p.name}</b>
                      </div>
                      <div className="detail-row">
                        <span>Stok saat ini</span>
                        <b>
                          {chosen?.s?.saldo} {low ? "(menipis)" : ""}
                        </b>
                      </div>
                      <div className="detail-row">
                        <span>Qty diminta</span>
                        <b>{qtyNum}</b>
                      </div>
                      <div className="detail-row">
                        <span>Keterangan</span>
                        <b>{note.trim() || "—"}</b>
                      </div>
                    </div>
                  )}
                  <div className="notice">
                    {preview ? <CheckCircle2 size={16} /> : <BellRing size={16} />}
                    {preview
                      ? "Periksa kembali — kirim untuk mencatat pengajuan (stok tidak berubah)."
                      : "Setelah dikirim, Pemilik menerima notifikasi simulasi."}
                  </div>
                  <div className="drawer-foot">
                    {preview ? (
                      <button type="button" className="btn btn-ghost" onClick={() => setPreview(false)}>
                        Kembali
                      </button>
                    ) : (
                      <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                        Batal
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={!productId}>
                      {preview ? "Kirim Pengajuan" : "Lanjut Pratinjau"}
                    </button>
                  </div>
                  {error && preview ? (
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
    </div>
  );
}
