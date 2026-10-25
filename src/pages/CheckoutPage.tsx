import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Building2,
  CreditCard,
  Glasses,
  Minus,
  Plus,
  QrCode,
  Trash2,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { RESEP_MAP, type Customer } from "../data/customers";
import type { PaymentMethod } from "../data/mock";
import { useCart } from "../context/CartContext";
import { useSharedStore } from "../store/sharedStore";
import { Avatar, PageHeader, Steps, formatIDR } from "../components/ui";
import "../styles/pages.css";

const METHODS: Array<{ id: PaymentMethod; label: string; desc: string; icon: typeof Banknote }> = [
  { id: "Tunai", label: "Tunai", desc: "Pembayaran dengan uang tunai", icon: Banknote },
  { id: "Transfer Bank", label: "Transfer Bank", desc: "Pembayaran melalui transfer bank", icon: Building2 },
  { id: "Kartu Debit/Kredit", label: "Kartu Debit/Kredit", desc: "Visa, Mastercard, JCB, dll", icon: CreditCard },
  { id: "QRIS", label: "QRIS", desc: "Pembayaran dengan QRIS", icon: QrCode },
];

export default function CheckoutPage() {
  const cart = useCart();
  const shared = useSharedStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const activeCustomer = picking ? null : cart.customer;
  const results = shared.customers.filter((c) =>
    `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  const resep = cart.customer ? RESEP_MAP[cart.customer.id] : undefined;

  const pick = (c: Customer) => {
    cart.setCustomer(c);
    setPicking(false);
    setQuery("");
    setWarning(null);
  };

  const finish = () => {
    if (cart.items.length === 0) {
      setWarning("Keranjang masih kosong. Tambahkan produk terlebih dahulu.");
      return;
    }
    if (!cart.customer) {
      setWarning("Pilih pelanggan terlebih dahulu sebelum menyelesaikan transaksi.");
      return;
    }
    // Verifikasi stok di sumber otoritatif (bukan angka dari browser saja).
    const kurang = cart.items
      .map((i) => ({ item: i, saldo: shared.stockOf(i.id)?.saldo }))
      .filter((x) => x.saldo !== undefined && x.item.qty > (x.saldo as number));
    if (kurang.length > 0) {
      const names = kurang.map((x) => `${x.item.name} (tersedia ${x.saldo})`).join(", ");
      setWarning(`Stok tidak mencukupi: ${names}. Kurangi jumlah atau pilih produk lain.`);
      return;
    }
    // Penjualan sukses mengurangi stok SATU KALI + mutasi OUT (idempoten via no. struk).
    const receipt = cart.complete();
    shared.recordSale(
      receipt.items.map((i) => ({ id: i.id, name: i.name, brand: i.brand, qty: i.qty, price: i.price })),
      receipt.no,
      "Kasir",
      receipt.method,
    );
    navigate("/transaksi-berhasil");
  };

  return (
    <div className="page">
      <PageHeader
        overline="CHECKOUT"
        title="Lengkapi data transaksi dan selesaikan pembayaran"
        desc="Pastikan data pelanggan, resep, dan produk sudah sesuai sebelum memproses pembayaran."
        actions={<Steps current={2} />}
      />

      <div className="checkout-grid">
        <div className="checkout-left">
          {/* Data Pelanggan */}
          <section className="co-card">
            <div className="section-head">
              <h2>Data Pelanggan</h2>
              <div className="section-action">
                <button className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
                  <UserPlus size={15} />
                  Tambah Pelanggan
                </button>
              </div>
            </div>

            {activeCustomer ? (
              <div className="cust-card">
                <Avatar initials={activeCustomer.initials} size={46} />
                <div className="cc-body">
                  <b>{activeCustomer.name}</b>
                  <div className="cc-meta">
                    <span>{activeCustomer.code}</span>
                    <span className="tag-mini">{activeCustomer.tier}</span>
                    <span>{activeCustomer.phone}</span>
                  </div>
                  <div className="cc-meta">{activeCustomer.email}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
                  Ubah
                </button>
              </div>
            ) : (
              <div>
                <label className="toolbar-search" style={{ marginBottom: 12 }}>
                  <Glasses size={16} />
                  <input
                    type="search"
                    placeholder="Cari pelanggan (nama, nomor HP, atau kode)."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <div className="cust-pick">
                  {results.map((c) => (
                    <button key={c.id} className="cust-pick-row" onClick={() => pick(c)}>
                      <Avatar initials={c.initials} size={40} />
                      <span className="pick-body">
                        <b>{c.name}</b>
                        <span>
                          {c.code} · {c.phone}
                        </span>
                      </span>
                      <span className="tag-mini">{c.tier}</span>
                    </button>
                  ))}
                  {results.length === 0 ? <div className="empty-note">Pelanggan tidak ditemukan.</div> : null}
                </div>
              </div>
            )}
          </section>

          {/* Resep Mata */}
          <section className="co-card">
            <div className="section-head">
              <h2>Resep Mata</h2>
              <div className="section-action">
                <button className="btn btn-ghost btn-sm" onClick={() => setQuery("")}>
                  Pilih Resep Tersimpan
                </button>
              </div>
            </div>
            {resep ? (
              <table className="rx-table">
                <thead>
                  <tr>
                    <th>Mata</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXIS</th>
                    <th>ADD</th>
                    <th>PD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OD (Kanan)</td>
                    <td>{resep.od.sph}</td>
                    <td>{resep.od.cyl}</td>
                    <td>{resep.od.axis}</td>
                    <td>{resep.add ?? "-"}</td>
                    <td>{resep.pd}</td>
                  </tr>
                  <tr>
                    <td>OS (Kiri)</td>
                    <td>{resep.os.sph}</td>
                    <td>{resep.os.cyl}</td>
                    <td>{resep.os.axis}</td>
                    <td>{resep.add ?? "-"}</td>
                    <td>{resep.pd}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="empty-note">
                Belum ada resep tersimpan untuk pelanggan ini. Pilih pelanggan atau ambil resep tersimpan.
              </div>
            )}
          </section>

          {/* Produk Dipilih */}
          <section className="co-card">
            <div className="section-head">
              <h2>Produk Dipilih</h2>
              <div className="section-action">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("/transaksi-baru")}>
                  <Plus size={15} />
                  Tambah Produk
                </button>
              </div>
            </div>

            {cart.items.length === 0 ? (
              <div className="empty-note">Belum ada produk dipilih.</div>
            ) : (
              cart.items.map((i) => (
                <div key={i.id} className="cart-line">
                  <span className="cl-ico">
                    <Glasses size={20} strokeWidth={1.7} />
                  </span>
                  <span className="cl-body">
                    <b>{i.name}</b>
                    <span>
                      {i.brand} · {i.category}
                    </span>
                  </span>
                  <span className="qty-box">
                    <button onClick={() => cart.setQty(i.id, i.qty - 1)} aria-label="Kurangi">
                      <Minus size={14} />
                    </button>
                    <b>{i.qty}</b>
                    <button onClick={() => cart.setQty(i.id, i.qty + 1)} aria-label="Tambah">
                      <Plus size={14} />
                    </button>
                  </span>
                  <span className="ci-price">{formatIDR(i.price * i.qty)}</span>
                  <button className="ci-remove" onClick={() => cart.remove(i.id)} aria-label={`Hapus ${i.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </section>
        </div>

        {/* Ringkasan Transaksi */}
        <aside className="summary">
          <div className="cart-head">
            <h2>Ringkasan Transaksi</h2>
            <span className="cart-count">{cart.count} produk</span>
          </div>

          <div className="sum-row">
            <span>Subtotal</span>
            <b>{formatIDR(cart.subtotal)}</b>
          </div>
          <div className="sum-row">
            <span>% Diskon</span>
            <span className="sum-inline">
              <input className="sum-input" value="0" readOnly aria-label="Diskon" />
              <b>Rp 0</b>
            </span>
          </div>
          <div className="sum-row">
            <span>Pajak (PPN {Math.round(cart.rate * 100)}%)</span>
            <b>{formatIDR(cart.tax)}</b>
          </div>

          <div className="sum-total">
            <span>Total</span>
            <b>{formatIDR(cart.total)}</b>
          </div>

          <div className="mini-label" style={{ letterSpacing: 1.3 }}>
            METODE PEMBAYARAN
          </div>
          <div className="pay-list">
            {METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  className={`pay-opt ${cart.method === m.id ? "on" : ""}`}
                  onClick={() => cart.setMethod(m.id)}
                >
                  <span className="po-ico">
                    <Icon size={18} />
                  </span>
                  <span className="po-body">
                    <b>{m.label}</b>
                    <span>{m.desc}</span>
                  </span>
                  <span className="radio-dot" />
                </button>
              );
            })}
          </div>

          {warning ? (
            <div className="notice">
              <TriangleAlert size={16} />
              {warning}
            </div>
          ) : null}

          <button className="btn btn-primary full" onClick={finish}>
            Selesaikan Transaksi
          </button>
        </aside>
      </div>
    </div>
  );
}
