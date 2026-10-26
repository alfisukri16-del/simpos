import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Glasses } from "lucide-react";
import { type PoStatus } from "../data/mock";
import { useSharedStore } from "../store/sharedStore";
import { RESEP_MAP } from "../data/customers";
import { Avatar, PageHeader, StatusPill } from "../components/ui";
import "../styles/pages.css";
import "../styles/admin.css";

const FLOW: PoStatus[] = ["Dipesan", "Diproses", "Sudah Datang", "Selesai"];
const FLOW_DESC: Record<PoStatus, string> = {
  Dipesan: "Menunggu proses",
  Diproses: "Menunggu proses",
  "Sudah Datang": "Menunggu barang",
  Selesai: "Belum selesai",
  Dibatalkan: "Dibatalkan oleh Admin",
};

export default function DetailPoPage() {
  const { id } = useParams();
  const shared = useSharedStore();
  // Status PO dari shared store — perubahan oleh Admin terbaca Kasir.
  const order = shared.pos.find((o) => o.id === id) ?? shared.pos[0];
  const current = Math.max(0, FLOW.indexOf(order.status));
  const cancelled = order.status === "Dibatalkan";
  const resep = RESEP_MAP["C-02"];

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/dashboard">Kasir</Link> › <Link to="/pemesanan">Pemesanan (PO)</Link> › <b>Detail PO</b>
          </>
        }
        overline="DETAIL PEMESANAN"
        title="Detail Pemesanan"
        desc="Pantau pesanan pelanggan dan perkembangan status dari Admin Cabang."
        actions={
          <span style={{ display: "inline-flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {order.status === "Sudah Datang" ? (
              <span className="btn btn-ghost btn-disabled" title="Aturan penyelesaian PO menunggu persetujuan klien">
                Tandai Selesai
                <em className="nav-soon">Needs client approval</em>
              </span>
            ) : null}
            <Link className="btn btn-ghost" to="/pemesanan">
              <ArrowLeft size={16} />
              Daftar PO
            </Link>
          </span>
        }
      />

      <div className="po-status-card">
        <div>
          <div className="po-mini-label">NOMOR PEMESANAN</div>
          <div className="po-big-no">{order.number}</div>
          <div className="po-created">Dibuat {order.createdAt}</div>
        </div>
        <div className="po-status-right">
          <div className="po-mini-label">STATUS PESANAN</div>
          <StatusPill label={order.status} />
          <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>
            {FLOW_DESC[order.status]}
          </span>
        </div>
      </div>

      <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="section-head">
          <div>
            <h2>Progres Pemesanan</h2>
            <div className="section-desc">Status diperbarui oleh Admin Cabang</div>
          </div>
        </div>
        <div className="progress" style={{ opacity: cancelled ? 0.45 : 1 }}>
          {FLOW.map((step, i) => (
            <div key={step} className={`pnode ${i < current ? "done" : ""} ${i === current ? "current" : ""}`}>
              <span className="pdot">{i < current ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
              <b>{step}</b>
              <span>{i === current ? order.createdAt.split(" · ")[0] + ", 14.24" : FLOW_DESC[step]}</span>
            </div>
          ))}
        </div>
        {cancelled ? (
          <div className="notice" role="status">
            PO ini dibatalkan oleh Admin Cabang. Hubungi Admin bila butuh pesanan baru.
          </div>
        ) : null}
      </section>

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="co-card">
            <div className="section-head">
              <h2>Data Pelanggan</h2>
            </div>
            <div className="cust-card">
              <Avatar initials="RP" size={46} />
              <div className="cc-body">
                <b>Rian Pratama</b>
                <div className="cc-meta">
                  <span>PLG-0001</span>
                  <span>0852 7712 9011</span>
                </div>
              </div>
            </div>
          </section>

          <section className="co-card">
            <div className="section-head">
              <h2>Produk yang Dipesan</h2>
              <div className="section-action">
                <span className="tag-mini">{order.items.length} item</span>
              </div>
            </div>
            {order.items.map((it) => (
              <div key={it.name} className="cart-line">
                <span className="cl-ico">
                  <Glasses size={20} strokeWidth={1.7} />
                </span>
                <span className="cl-body">
                  <b>{it.name}</b>
                  <span>{it.sub}</span>
                </span>
                <b style={{ fontSize: 13.5 }}>×{it.qty}</b>
              </div>
            ))}
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="co-card">
            <div className="section-head">
              <h2>Resep Mata</h2>
            </div>
            {resep ? (
              <table className="rx-table">
                <thead>
                  <tr>
                    <th>MATA</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXIS</th>
                    <th>ADD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OD (Kanan)</td>
                    <td>{resep.od.sph}</td>
                    <td>{resep.od.cyl}</td>
                    <td>{resep.od.axis}</td>
                    <td>{resep.add ?? "-"}</td>
                  </tr>
                  <tr>
                    <td>OS (Kiri)</td>
                    <td>{resep.os.sph}</td>
                    <td>{resep.os.cyl}</td>
                    <td>{resep.os.axis}</td>
                    <td>{resep.add ?? "-"}</td>
                  </tr>
                </tbody>
              </table>
            ) : null}
            <div className="tt-sub" style={{ fontWeight: 600 }}>
              Resep tersimpan bersama pesanan ini.
            </div>
          </section>

          <section className="co-card">
            <div className="section-head">
              <h2>Catatan Pesanan</h2>
            </div>
            <div>
              <div className="note-line">
                <i />
                Pembuatan lensa mengikuti resep terlampir.
              </div>
              <div className="note-line">
                <i />
                Hubungi pelanggan saat pesanan tersedia.
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="tt-sub" style={{ padding: "0 6px", fontWeight: 600 }}>
        Kasir dapat memantau PO. Proses dan perubahan status ditangani Admin Cabang.
      </div>
    </div>
  );
}
