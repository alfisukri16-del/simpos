import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ClipboardList, PackageCheck, PackagePlus, Plus, X } from "lucide-react";
import { type PoStatus } from "../data/mock";
import { CUSTOMERS } from "../data/customers";
import { useSharedStore } from "../store/sharedStore";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import "../styles/pages.css";
import "../styles/admin.css";

const FILTERS: Array<"Semua" | PoStatus> = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai"];

export default function PemesananPage() {
  const shared = useSharedStore();
  const [filter, setFilter] = useState<"Semua" | PoStatus>("Semua");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(CUSTOMERS[0].id);
  const [productId, setProductId] = useState("P-001");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  // PO dibaca dari shared store — status proses Admin langsung terlihat di sini.
  const rows = shared.pos.filter((o) => (filter === "Semua" ? true : o.status === filter)).filter((o) =>
    `${o.number} ${o.customer}`.toLowerCase().includes(query.toLowerCase()),
  );

  const poBaru = shared.pos.filter((o) => o.status === "Dipesan").length;
  const diproses = shared.pos.filter((o) => o.status === "Diproses").length;
  const datang = shared.pos.filter((o) => o.status === "Sudah Datang").length;

  const products = shared.products.filter((p) => p.status === "Aktif" && p.type !== "Aksesoris");
  const chosenProduct = products.find((p) => p.id === productId) ?? products[0];
  const willSnapshot = chosenProduct?.type === "Lensa";

  const startCreate = () => {
    setCustomerId(CUSTOMERS[0].id);
    setProductId(products[0]?.id ?? "P-001");
    setQty("1");
    setNote("");
    setFormError("");
    setCreated(null);
    setOpen(true);
  };

  const submitPO = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]+$/.test(qty.trim())) {
      setFormError("Jumlah harus bilangan bulat lebih dari 0 (tanpa titik, koma, atau minus).");
      return;
    }
    const r = shared.createPO({ customerId, productId, qty: Number(qty.trim()), note, actor: "Kasir" });
    if (!r.ok) {
      setFormError(r.msg);
      return;
    }
    setCreated(r.id ?? null);
    setOpen(false);
  };

  return (
    <div className="page">
      <PageHeader
        overline="MANAJEMEN PESANAN"
        title="Pemesanan (PO)"
        desc="Pantau perkembangan pesanan pelanggan di Cabang Padang"
        actions={
          <button className="btn btn-primary" onClick={startCreate}>
            <Plus size={16} />
            Buat PO Baru
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Pesanan Baru" value={String(poBaru).padStart(2, "0")} caption="Menunggu pemrosesan admin" icon={<PackagePlus size={22} />} tone="violet" />
        <StatCard label="Sedang Diproses" value={String(diproses).padStart(2, "0")} caption="Dalam penanganan cabang" icon={<ClipboardList size={22} />} tone="amber" />
        <StatCard label="Sudah Datang" value={String(datang).padStart(2, "0")} caption="Siap dinubungi pelanggan" icon={<PackageCheck size={22} />} tone="green" />
      </div>

      {created ? (
        <div className="notice notice-ok" role="status">
          PO {created} tercatat (Dipesan) dan diteruskan ke antrean Admin Cabang.{" "}
          <Link className="link-action" to={`/pemesanan/${created}`}>
            Lihat detail
            <ChevronRight size={15} />
          </Link>
        </div>
      ) : null}

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Daftar Pemesanan</h2>
            <div className="section-desc">Informasi pesanan dan status terbaru</div>
          </div>
          <div className="section-action">
            <select className="select-pill" aria-label="Rentang pesanan" defaultValue="all">
              <option value="all">Semua Pesanan</option>
              <option value="week">7 hari terakhir</option>
              <option value="month">Bulan ini</option>
            </select>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox placeholder="Cari nomor PO atau nama pelanggan..." value={query} onChange={setQuery} />
          <div className="toolbar-chips">
            {FILTERS.map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </div>
          <select className="select-pill" aria-label="Status" defaultValue="all">
            <option value="all">Status</option>
            <option value="dipesan">Dipesan</option>
            <option value="diproses">Diproses</option>
            <option value="datang">Sudah datang</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>NO. PO / TANGGAL</th>
                <th>PELANGGAN</th>
                <th>PRODUK DIPESAN</th>
                <th>STATUS PO</th>
                <th className="tt-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="tt-num">{o.number}</div>
                    <div className="tt-sub">{o.date}</div>
                  </td>
                  <td>
                    <div className="cell-person">
                      <Avatar initials={o.initials} size={40} />
                      <span>
                        <b>{o.customer}</b>
                        <span>{o.phone}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {o.productLabel}
                    </div>
                    <div className="tt-sub">{o.products[1]}</div>
                  </td>
                  <td>
                    <StatusPill label={o.status} />
                  </td>
                  <td className="tt-right">
                    <Link className="link-action" to={`/pemesanan/${o.id}`}>
                      Lihat detail
                      <ChevronRight size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-note">Tidak ada pesanan yang cocok dengan filter.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-foot">
            <span className="foot-note">Menampilkan {rows.length} dari {shared.pos.length} pesanan · data demo</span>
          </div>
        </div>
      </section>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>Buat PO Baru</h2>
                <div className="section-desc">Status awal Dipesan · diteruskan ke Admin Cabang</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitPO} className="drawer-form" noValidate>
              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}
              <label className="afield">
                <span>Pelanggan</span>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  {CUSTOMERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="afield">
                <span>Produk (frame / lensa)</span>
                <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.brand}
                    </option>
                  ))}
                </select>
              </label>
              <label className="afield">
                <span>Jumlah</span>
                <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="cth. 1" />
              </label>
              <label className="afield">
                <span>Catatan (opsional)</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. lensa sesuai resep" />
              </label>
              <div className="tt-sub" style={{ fontWeight: 600 }}>
                {willSnapshot
                  ? "Snapshot ukuran lensa disalin otomatis dari resep pelanggan saat PO dibuat."
                  : "PO frame tidak menyertakan snapshot resep."}
              </div>
              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Buat PO
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
