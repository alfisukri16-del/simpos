import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Boxes,
  ChevronRight,
  ClipboardList,
  Minus,
  PackageCheck,
  PackagePlus,
  Plus,
  X,
} from "lucide-react";
import { type PoStatus } from "../data/mock";
import { useSharedStore } from "../store/sharedStore";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill, formatIDR } from "../components/ui";
import "../styles/pages.css";
import "../styles/admin.css";

const FILTERS: Array<"Semua" | PoStatus> = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai", "Dibatalkan"];

export default function PemesananPage() {
  const shared = useSharedStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<"Semua" | PoStatus>("Semua");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [customerId, setCustomerId] = useState(shared.customers[0]?.id ?? "C-01");
  const [productId, setProductId] = useState("P-001");
  const [qty, setQty] = useState("1");
  const [resepId, setResepId] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  const products = shared.products.filter((p) => p.status === "Aktif" && p.type !== "Aksesoris");

  // Buka otomatis modal Buat PO bila diarahkan dari Katalog/Checkout (?productId=...)
  useEffect(() => {
    const pid = searchParams.get("productId");
    if (pid && products.some((p) => p.id === pid)) {
      setCustomerId(shared.customers[0]?.id ?? "C-01");
      setProductId(pid);
      setQty("1");
      setNote("");
      setFormError("");
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, products, shared.customers, setSearchParams]);

  // PO dibaca dari shared store — Kasir mencatat PO dan memantau status yang diperbarui Admin Cabang.
  const rows = shared.pos
    .filter((o) => (filter === "Semua" ? true : o.status === filter))
    .filter((o) => `${o.number} ${o.customer} ${o.phone} ${o.productLabel}`.toLowerCase().includes(query.toLowerCase()));

  const poBaru = shared.pos.filter((o) => o.status === "Dipesan").length;
  const diproses = shared.pos.filter((o) => o.status === "Diproses").length;
  const datang = shared.pos.filter((o) => o.status === "Sudah Datang").length;

  const chosenCustomer = shared.customers.find((c) => c.id === customerId) ?? shared.customers[0];
  const customerReseps = shared.reseps.filter((r) => chosenCustomer && r.customer === chosenCustomer.name);

  const chosenProduct = products.find((p) => p.id === productId) ?? products[0];
  const chosenSaldo = chosenProduct ? (shared.stockOf(chosenProduct.id)?.saldo ?? 0) : 0;
  const isLensa = chosenProduct?.type === "Lensa";

  const numericQty = Math.max(1, Number.parseInt(qty || "1", 10) || 1);
  const estimatedTotal = (chosenProduct?.price ?? 0) * numericQty;

  useEffect(() => {
    setResepId(customerReseps[0]?.id ?? "");
  }, [customerId, customerReseps.length]);

  const stepQty = (delta: number) => {
    const next = Math.max(1, numericQty + delta);
    setQty(String(next));
    setFormError("");
  };

  const startCreate = () => {
    setCustomerId(shared.customers[0]?.id ?? "C-01");
    setProductId(products[0]?.id ?? "P-001");
    setQty("1");
    setNote("");
    setFormError("");
    setCreated(null);
    setOpen(true);
  };

  const submitPO = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]+$/.test(qty.trim()) || Number(qty.trim()) <= 0) {
      setFormError("Jumlah harus bilangan bulat lebih dari 0 (tanpa titik, koma, atau minus).");
      return;
    }

    const r = shared.createPO({
      customerId,
      productId: chosenProduct?.id ?? productId,
      qty: Number(qty.trim()),
      note,
      actor: "Kasir",
      resepId: isLensa && resepId ? resepId : undefined,
    });
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
        desc="Catat pemesanan pelanggan (frame/lensa) dan pantau perkembangan status pesanan di Cabang Padang"
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
        <StatCard label="Sudah Datang" value={String(datang).padStart(2, "0")} caption="Siap diambil pelanggan" icon={<PackageCheck size={22} />} tone="green" />
      </div>

      {created ? (
        <div className="notice notice-ok" role="status">
          PO {created} berhasil dicatat dengan status <b>Dipesan</b> dan diteruskan ke Admin Cabang.{" "}
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
            <div className="section-desc">Informasi pesanan pelanggan dan status terbaru dari Admin Cabang</div>
          </div>
        </div>

        <div className="toolbar">
          <SearchBox placeholder="Cari nomor PO, nama pelanggan, atau nomor HP..." value={query} onChange={setQuery} />
          <div className="toolbar-chips">
            {FILTERS.map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="tt">
            <thead>
              <tr>
                <th>NO. PO / TANGGAL</th>
                <th>PELANGGAN</th>
                <th>PRODUK DIPESAN</th>
                <th className="tt-center">STATUS PO</th>
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
                  <td className="tt-center">
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
            <span className="foot-note">Menampilkan {rows.length} dari {shared.pos.length} pesanan</span>
          </div>
        </div>
      </section>

      {open ? (
        <div className="overlay po-modal-overlay" onClick={() => setOpen(false)}>
          <div className="drawer simple-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="simple-modal-head">
              <div className="smh-left">
                <div className="smh-ico">
                  <PackagePlus size={20} />
                </div>
                <div>
                  <h2>Buat PO Baru</h2>
                  <p>Catat pemesanan pelanggan · Status awal: Dipesan</p>
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitPO} className="drawer-form simple-modal-form" noValidate>
              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}

              <label className="afield">
                <span>Pelanggan</span>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  {shared.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone} ({c.code})
                    </option>
                  ))}
                </select>
              </label>

              <div className="afield">
                <span>Produk (Frame / Lensa)</span>
                <select value={chosenProduct?.id ?? productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map((p) => {
                    const saldo = shared.stockOf(p.id)?.saldo ?? 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.brand} ({p.type} · Stok cabang: {saldo})
                      </option>
                    );
                  })}
                </select>
                {chosenProduct ? (
                  <div className="simple-meta-strip">
                    <span>
                      <Boxes size={13} /> Stok cabang: <b>{chosenSaldo} unit</b>
                    </span>
                    <span>
                      Harga satuan: <b>{formatIDR(chosenProduct.price)}</b>
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="po-qty-notes-grid">
                <div className="afield">
                  <span>Jumlah Barang</span>
                  <div className="po-qty-stepper">
                    <button type="button" onClick={() => stepQty(-1)} aria-label="Kurangi jumlah">
                      <Minus size={14} />
                    </button>
                    <input
                      inputMode="numeric"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="1"
                    />
                    <button type="button" onClick={() => stepQty(1)} aria-label="Tambah jumlah">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <label className="afield">
                  <span>Catatan Pesanan (opsional)</span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="cth. lensa sesuai resep"
                  />
                </label>
              </div>

              {isLensa ? (
                customerReseps.length > 0 ? (
                  <label className="afield">
                    <span>Pilih Resep Tersimpan</span>
                    <select value={resepId} onChange={(e) => setResepId(e.target.value)}>
                      {customerReseps.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} ({r.date}) — OD {r.od.sph} / OS {r.os.sph} · PD {r.pd} mm
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="tt-sub" style={{ fontWeight: 600, marginTop: 0 }}>
                    Pelanggan ini belum memiliki arsip resep di menu Resep Mata.
                  </div>
                )
              ) : null}

              <div className="simple-total-bar">
                <span>Estimasi Nilai Pesanan ({numericQty} unit)</span>
                <b>{formatIDR(estimatedTotal)}</b>
              </div>

              <div className="drawer-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <PackagePlus size={16} />
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
