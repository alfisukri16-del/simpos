import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Glasses, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CATEGORIES, type Category } from "../data/catalog";
import { useSharedStore } from "../store/sharedStore";
import { useCart } from "../context/CartContext";
import { Chip, PageHeader, Steps, formatIDR } from "../components/ui";
import "../styles/pages.css";

export default function TransaksiBaruPage() {
  const cart = useCart();
  const shared = useSharedStore();
  const [tab, setTab] = useState<"Semua" | Category>("Semua");
  const [sort, setSort] = useState("relevan");

  // Katalog dibaca dari shared store (produk kelolaan Admin ikut tampil); bentuk & UI tak berubah.
  const catalog = shared.products
    .filter((p) => p.status === "Aktif")
    .map((p) => ({ id: p.id, name: p.name, brand: p.brand, category: p.type as Category, price: p.price, tag: p.tag }));

  const filtered = catalog.filter((p) => (tab === "Semua" ? true : p.category === tab)).sort((a, b) => {
    if (sort === "murah") return a.price - b.price;
    if (sort === "mahal") return b.price - a.price;
    return 0;
  });

  return (
    <div className="page">
      <PageHeader
        overline="TRANSAKSI BARU"
        title="Pilih frame dan lensa untuk pelanggan"
        desc="Tambahkan produk ke keranjang, lalu lanjutkan ke checkout untuk menyelesaikan transaksi."
        actions={<Steps current={1} />}
      />

      <div className="catalog-grid">
        <div className="catalog-main">
          <div className="toolbar">
            <div className="toolbar-chips">
              {CATEGORIES.map((c) => (
                <Chip key={c} active={tab === c} onClick={() => setTab(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select className="select-pill" aria-label="Merek" defaultValue="all">
                <option value="all">Merek</option>
                <option value="rayban">Ray-Ban</option>
                <option value="oakley">Oakley</option>
                <option value="vogue">Vogue</option>
              </select>
              <select className="select-pill" aria-label="Kategori" defaultValue="all">
                <option value="all">Kategori</option>
                <option value="frame">Frame</option>
                <option value="lensa">Lensa</option>
                <option value="aksesoris">Aksesoris</option>
              </select>
              <select
                className="select-pill"
                aria-label="Urutkan"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="relevan">Urutkan</option>
                <option value="murah">Harga terendah</option>
                <option value="mahal">Harga tertinggi</option>
              </select>
            </div>
          </div>

          <div className="product-grid">
            {filtered.map((p) => (
              <button key={p.id} className="product-card" onClick={() => cart.add(p)}>
                <div className="product-thumb">
                  {p.tag ? <span className="pc-tag">{p.tag}</span> : null}
                  <Glasses size={40} strokeWidth={1.6} />
                </div>
                <div>
                  <div className="pc-cat">{p.category.toUpperCase()}</div>
                  <div className="pc-name">{p.name}</div>
                  <div className="pc-brand">{p.brand}</div>
                </div>
                <div className="pc-foot">
                  <b>{formatIDR(p.price)}</b>
                  <span className="pc-add" aria-hidden="true">
                    <Plus size={17} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="cart-panel">
          <div className="cart-head">
            <h2>Keranjang</h2>
            <span className="cart-count">{cart.count} produk</span>
          </div>

          {cart.items.length === 0 ? (
            <div className="cart-empty">
              Keranjang masih kosong.
              <br />
              Pilih produk untuk memulai transaksi.
            </div>
          ) : (
            cart.items.map((i) => (
              <div key={i.id} className="cart-item">
                <span className="ci-ico">
                  <Glasses size={20} strokeWidth={1.7} />
                </span>
                <span className="ci-body">
                  <b>{i.name}</b>
                  <span>
                    {i.brand} · {i.category}
                  </span>
                </span>
                <span className="ci-price">{formatIDR(i.price * i.qty)}</span>
                <button className="ci-remove" onClick={() => cart.remove(i.id)} aria-label={`Hapus ${i.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}

          <div className="cart-total">
            <span>Subtotal ({cart.count} produk)</span>
            <b>{formatIDR(cart.subtotal)}</b>
          </div>

          <Link
            className="btn btn-primary full"
            to="/checkout"
            style={cart.items.length === 0 ? { opacity: 0.55, pointerEvents: "none" } : undefined}
            aria-disabled={cart.items.length === 0}
          >
            <ShoppingBag size={17} />
            Lanjut ke Checkout
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
