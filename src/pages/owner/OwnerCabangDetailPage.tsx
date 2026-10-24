import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BRANCHES, useSharedStore } from "../../store/sharedStore";
import { PageHeader, StatCard, StatusPill, formatIDR } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function OwnerCabangDetailPage() {
  const { id } = useParams();
  const store = useSharedStore();
  const branch = BRANCHES.find((b) => b.id === id) ?? BRANCHES[1];
  const isPusat = branch.id === "pusat";

  const stock = isPusat ? store.centralStock : store.stock;
  const low = stock
    .map((s) => ({ s, p: store.productOf(s.productId)! }))
    .filter(({ s, p }) => p && p.status === "Aktif" && s.saldo <= s.minimum);
  const sales = store.transactions.filter((t) => t.status === "Selesai" && (t.branchId ?? "cabang-padang") === branch.id);
  const omzet = sales.reduce((a, t) => a + t.total, 0);
  const pos = store.pos.filter((o) => o.branchId === branch.id).slice(0, 5);
  const reqs = store.requests.filter((r) => r.branchId === branch.id).slice(0, 5);

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/owner/dashboard">Pemilik</Link> › <Link to="/owner/cabang">Cabang</Link> › <b>{branch.name}</b>
          </>
        }
        overline="MONITORING — DETAIL LOKASI"
        title={branch.name}
        desc={isPusat ? "Gudang pusat: stok dialokasikan ke cabang (read-only)." : "Ringkasan operasional cabang (read-only)."}
        actions={
          <Link className="btn btn-ghost" to="/owner/cabang">
            <ArrowLeft size={16} />
            Daftar Lokasi
          </Link>
        }
      />

      <div className="stat-row">
        <StatCard label="Total unit stok" value={String(stock.reduce((a, s) => a + s.saldo, 0))} caption={`${stock.length} produk`} tone="violet" />
        <StatCard label="Transaksi sukses" value={String(sales.length)} caption={formatIDR(omzet)} tone="green" />
        <StatCard label="Stok menipis" value={String(low.length)} caption="Saldo ≤ minimum" tone="amber" />
      </div>

      <div className="two-col">
        <section className="co-card">
          <div className="section-head">
            <h2>Stok Menipis</h2>
          </div>
          {low.map(({ s, p }) => (
            <div key={p.id} className="todo-row">
              <div className="todo-body">
                <b>{p.name}</b>
                <span>
                  {p.code} · stok {s.saldo} / min {s.minimum}
                </span>
              </div>
              <StatusPill label="Stok Menipis" />
            </div>
          ))}
          {low.length === 0 ? <div className="empty-note">Tidak ada stok menipis di lokasi ini.</div> : null}
        </section>

        <section className="co-card">
          <div className="section-head">
            <h2>Aktivitas Terakhir</h2>
          </div>
          {sales.slice(0, 3).map((t) => (
            <div key={t.id} className="todo-row">
              <div className="todo-body">
                <b>{t.no}</b>
                <span>
                  {t.date} · {t.customer}
                </span>
              </div>
              <b style={{ fontSize: 13.5 }}>{formatIDR(t.total)}</b>
            </div>
          ))}
          {pos.slice(0, 2).map((o) => (
            <div key={o.id} className="todo-row">
              <div className="todo-body">
                <b>{o.number}</b>
                <span>{o.customer}</span>
              </div>
              <StatusPill label={o.status} />
            </div>
          ))}
          {!isPusat &&
            reqs.slice(0, 2).map((r) => (
              <div key={r.id} className="todo-row">
                <div className="todo-body">
                  <b>Pengajuan {r.id}</b>
                  <span>
                    {store.productOf(r.productId)?.name} × {r.qty}
                  </span>
                </div>
                <StatusPill label={r.status} />
              </div>
            ))}
          {sales.length === 0 && pos.length === 0 ? <div className="empty-note">Belum ada aktivitas tercatat.</div> : null}
        </section>
      </div>
    </div>
  );
}
