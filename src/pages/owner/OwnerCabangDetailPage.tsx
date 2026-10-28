import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Boxes } from "lucide-react";
import { useSharedStore } from "../../store/sharedStore";
import { PageHeader, StatCard, StatusPill, formatIDR } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function OwnerCabangDetailPage() {
  const { id } = useParams();
  const store = useSharedStore();
  const branch = store.branches.find((b) => b.id === id);

  if (!branch) {
    return (
      <div className="page">
        <PageHeader
          overline="MONITORING - DETAIL CABANG"
          title="Cabang tidak ditemukan"
          desc="Cabang yang Anda buka tidak tersedia."
          actions={
            <Link className="btn btn-ghost" to="/owner/cabang">
              <ArrowLeft size={16} />
              Daftar Cabang
            </Link>
          }
        />
        <div className="empty-note">Pilih cabang dari daftar monitoring.</div>
      </div>
    );
  }

  const isPusat = branch.id === "pusat";
  const stock = store.stockForBranch(branch.id);
  const low = stock.filter(
    (s) => store.productOf(s.productId)?.status === "Aktif" && s.saldo <= s.minimum && s.saldo > 0,
  );
  const sales = store.transactions.filter(
    (t) => t.status === "Selesai" && (t.branchId ?? "cabang-padang") === branch.id,
  );
  const omzet = sales.reduce((a, t) => a + t.total, 0);
  const pos = store.pos.filter((o) => o.branchId === branch.id);
  const poActive = pos.filter((o) => o.status === "Dipesan" || o.status === "Diproses");

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/owner/dashboard">Pemilik</Link> / <Link to="/owner/cabang">Cabang</Link> /{" "}
            <b>{branch.name}</b>
          </>
        }
        overline="MONITORING - DETAIL CABANG"
        title={branch.name}
        desc={
          isPusat
            ? "Gudang pusat: sumber stok untuk seluruh cabang."
            : "Profil dan ringkasan operasional cabang."
        }
        actions={
          <>
            <Link className="btn btn-ghost" to="/owner/cabang">
              <ArrowLeft size={16} />
              Daftar Cabang
            </Link>
            <Link className="btn btn-primary" to={`/owner/stok?loc=${branch.id}`}>
              <Boxes size={16} />
              Lihat Stok
            </Link>
          </>
        }
      />

      <div className="stat-row">
        <StatCard
          label="Transaksi Sukses"
          value={String(sales.length)}
          caption={formatIDR(omzet)}
          tone="green"
        />
        <StatCard
          label="PO Aktif"
          value={String(poActive.length)}
          caption={`${pos.length} total PO`}
          tone="blue"
        />
        <StatCard
          label="Stok Menipis"
          value={String(low.length)}
          caption={`${stock.reduce((a, s) => a + s.saldo, 0)} unit di ${stock.length} produk`}
          tone="amber"
        />
      </div>

      <div className="two-col" style={{ alignItems: "start" }}>
        <section className="co-card">
          <div className="section-head">
            <div>
              <h2>Identitas Cabang</h2>
              <div className="section-desc">Kode, jenis, dan lokasi operasional.</div>
            </div>
            <StatusPill label={branch.status} />
          </div>
          <div className="detail-rows">
            <div className="detail-row">
              <span>Kode</span>
              <b>{branch.code}</b>
            </div>
            <div className="detail-row">
              <span>Jenis</span>
              <b>{branch.type}</b>
            </div>
            <div className="detail-row">
              <span>Kota</span>
              <b>{branch.city}</b>
            </div>
          </div>
        </section>

        <section className="co-card">
          <div className="section-head">
            <div>
              <h2>Kontak & Penanggung Jawab</h2>
              <div className="section-desc">Alamat dan narahubung operasional cabang.</div>
            </div>
          </div>
          <div className="detail-rows">
            <div className="detail-row">
              <span>Alamat</span>
              <b>{branch.address}</b>
            </div>
            <div className="detail-row">
              <span>Telepon</span>
              <b>{branch.phone}</b>
            </div>
            <div className="detail-row">
              <span>Penanggung jawab</span>
              <b>{branch.pic}</b>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
