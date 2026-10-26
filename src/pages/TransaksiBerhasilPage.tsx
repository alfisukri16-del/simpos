import { Link, useNavigate } from "react-router-dom";
import { Check, Glasses, History, Printer, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Steps, formatIDR } from "../components/ui";
import "../styles/pages.css";

export default function TransaksiBerhasilPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const r = cart.receipt;

  const items = r?.items ?? [
    { id: "d1", name: "Titanium Classic", brand: "Ray-Ban", category: "Frame", price: 1_850_000, qty: 1 },
    { id: "d2", name: "Lensa Blue Control", brand: "Hoya", category: "Lensa", price: 1_250_000, qty: 1 },
  ];
  const subtotal = r?.subtotal ?? 3_100_000;
  const total = r?.total ?? subtotal;

  return (
    <div className="success page">
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 6px 0" }}>
        <Steps current={3} />
      </div>

      <div className="success-hero">
        <span className="success-badge">
          <Check size={38} strokeWidth={3} />
        </span>
        <h1>Transaksi Berhasil</h1>
        <p>Pembayaran telah diproses dan pesanan berhasil disimpan.</p>
      </div>

      <div className="two-col">
        <section className="co-card">
          <div className="section-head">
            <h2>Informasi Transaksi</h2>
          </div>
          <div>
            <div className="info-row">
              <span>No. Transaksi</span>
              <b>{r?.no ?? "TRX-20250118-0032"}</b>
            </div>
            <div className="info-row">
              <span>Tanggal &amp; Jam</span>
              <b>
                {r ? `${r.date}, ${r.time} WIB` : "18 Jan 2025, 14:32 WIB"}
              </b>
            </div>
            <div className="info-row">
              <span>Kasir</span>
              <b>Korena Saif</b>
            </div>
            <div className="info-row">
              <span>Nama Pelanggan</span>
              <b>{r?.customer?.name ?? "Andi Saputra"}</b>
            </div>
            <div className="info-row">
              <span>Metode Pembayaran</span>
              <b>{r?.method ?? "Tunai"}</b>
            </div>
            <div className="info-row">
              <span>Total Pembayaran</span>
              <b>{formatIDR(total)}</b>
            </div>
            <div className="info-row">
              <span>Status</span>
              <span className="status-pill" style={{ background: "#e2f7ec", color: "#1f9d63" }}>
                <i style={{ background: "#1f9d63" }} />
                Lunas
              </span>
            </div>
          </div>
        </section>

        <section className="co-card">
          <div className="section-head">
            <h2>Produk yang Dibeli</h2>
          </div>
          <div>
            {items.map((i) => (
              <div key={i.id} className="receipt-line">
                <span className="rl-ico">
                  <Glasses size={20} strokeWidth={1.7} />
                </span>
                <span className="rl-body">
                  <b>{i.name}</b>
                  <span>
                    {i.brand} · {i.category} · Qty: {i.qty}
                  </span>
                </span>
                <span className="tt-money">{formatIDR(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div className="section-head" style={{ marginTop: 6 }}>
            <h2>Ringkasan Pembayaran</h2>
          </div>
          <div>
            <div className="info-row">
              <span>Subtotal</span>
              <b>{formatIDR(subtotal)}</b>
            </div>
            <div className="info-row">
              <span>Diskon</span>
              <b>Rp 0</b>
            </div>
            <div className="info-row">
              <span>
                <b style={{ color: "var(--ink)" }}>Total Pembayaran</b>
              </span>
              <b>{formatIDR(total)}</b>
            </div>
          </div>
        </section>
      </div>

      <div className="action-row">
        <div className="receipt-note">
          <span className="rn-ico">
            <ShieldCheck size={22} />
          </span>
          <div>
            <b>Data Tersimpan dengan Aman</b>
            <p>
              Data transaksi, produk, dan pembayaran telah berhasil disimpan ke sistem. Anda dapat menghubungi
              pelanggan jika diperlukan.
            </p>
          </div>
        </div>

        <div className="btn-group">
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Printer size={16} />
            Cetak Struk
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/transaksi-baru")}>
            Transaksi Baru
          </button>
          <Link className="btn btn-ghost" to="/riwayat-transaksi">
            <History size={16} />
            Lihat Riwayat
          </Link>
        </div>
      </div>
    </div>
  );
}
