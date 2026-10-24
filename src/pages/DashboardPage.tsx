import { Link } from "react-router-dom";
import {
  ShoppingCart,
  ClipboardList,
  Users,
  Glasses,
  ArrowRight,
  History,
} from "lucide-react";
import { DEMO_SESSION } from "../data/nav";
import "../styles/dashboard.css";

const MENU = [
  {
    to: "/transaksi-baru",
    icon: ShoppingCart,
    title: "Transaksi Baru",
    desc: "Pilih frame dan lensa untuk pelanggan baru",
    featured: true,
  },
  {
    to: "/pemesanan",
    icon: ClipboardList,
    title: "Pemesanan (PO)",
    desc: "Kelola pesanan barang yang belum tersedia",
  },
  {
    to: "/pelanggan",
    icon: Users,
    title: "Pelanggan",
    desc: "Cari, tambah, atau kelola data pelanggan",
  },
  {
    to: "/resep-mata",
    icon: Glasses,
    title: "Resep Mata",
    desc: "Kelola dan lihat riwayat resep pelanggan",
  },
];

export default function DashboardPage() {
  return (
    <div className="dash">
      <section className="hero">
        <div className="hero-copy">
          <span className="overline">SELAMAT DATANG</span>
          <h1>{DEMO_SESSION.cashierName}</h1>
          <p>Siap melayani pelanggan hari ini?</p>
          <Link className="btn btn-primary" to="/transaksi-baru">
            <ShoppingCart size={18} />
            Mulai Transaksi
          </Link>
        </div>
        <div className="hero-media" aria-hidden="true">
          <img src="/assets/hero-approved-right.jpg" alt="" />
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Menu Utama</h2>
          <p>Pilih menu untuk memulai aktivitas</p>
        </div>

        <div className="menu-cards">
          {MENU.map((m) => (
            <Link key={m.to} to={m.to} className={`menu-card ${m.featured ? "featured" : ""}`}>
              <span className="m-icon">
                <m.icon size={24} strokeWidth={2.1} />
              </span>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span className="m-arrow">
                <ArrowRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="history-strip">
        <span className="h-icon">
          <History size={24} strokeWidth={2.1} />
        </span>
        <div>
          <h3>Riwayat Transaksi</h3>
          <p>Lihat transaksi hari ini atau cari transaksi sebelumnya</p>
        </div>
        <Link className="btn btn-ghost" to="/riwayat-transaksi">
          Buka
          <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
