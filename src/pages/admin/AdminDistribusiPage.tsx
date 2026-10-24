import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function AdminDistribusiPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Menunggu Diterima" | "Diterima Sebagian" | "Diterima">("Semua");

  const rows = useMemo(
    () =>
      store.distributions
        .filter((d) => (filter === "Semua" ? true : d.status === filter))
        .filter((d) => `${d.id} ${d.from} ${d.date}`.toLowerCase().includes(q.toLowerCase())),
    [store.distributions, q, filter],
  );

  return (
    <div className="page">
      <PageHeader
        overline="PERSEDIAAN — DISTRIBUSI"
        title="Distribusi Masuk"
        desc={`Alokasi dari pusat untuk ${DEMO_ADMIN.branch}. Jumlah alokasi ditetapkan Pemilik (read-only) — Admin hanya mencatat penerimaan aktual.`}
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari nomor distribusi, asal, atau tanggal..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          {(["Semua", "Menunggu Diterima", "Diterima Sebagian", "Diterima"] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <div className="notice">
        <Truck size={16} />
        Stok pusat berkurang kapan (saat alokasi / kirim / terima) masih keputusan terbuka PRD — prototype ini hanya
        menambah stok cabang saat penerimaan dikonfirmasi.
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>ID / TANGGAL</th>
              <th>ASAL → TUJUAN</th>
              <th>ITEM</th>
              <th className="tt-right">ALOKASI</th>
              <th className="tt-right">DITERIMA</th>
              <th>STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const alokasi = d.lines.reduce((a, l) => a + l.qtyAlokasi, 0);
              const diterima = d.lines.reduce((a, l) => a + l.qtyDiterima, 0);
              const itemNames = d.lines
                .map((l) => store.productOf(l.productId)?.name ?? l.productId)
                .join(", ");
              return (
                <tr key={d.id}>
                  <td>
                    <div className="tt-num">{d.id}</div>
                    <div className="tt-sub">{d.date}</div>
                  </td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {d.from} → {DEMO_ADMIN.branch}
                    </div>
                  </td>
                  <td>
                    <div className="tt-sub" style={{ marginTop: 0, maxWidth: 260 }}>
                      {d.lines.length} produk: {itemNames}
                    </div>
                  </td>
                  <td className="tt-right tt-money">{alokasi}</td>
                  <td className="tt-right tt-money">{diterima}</td>
                  <td>
                    <StatusPill label={d.status} />
                  </td>
                  <td className="tt-right">
                    {d.status === "Diterima" ? (
                      <span className="tt-sub" style={{ marginTop: 0 }}>
                        Selesai
                      </span>
                    ) : (
                      <Link className="link-action" to="/admin/penerimaan">
                        Catat Penerimaan
                        <ArrowRight size={15} />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-note">Tidak ada distribusi yang cocok.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Menampilkan {rows.length} distribusi · data demo cabang {DEMO_ADMIN.branch}</span>
        </div>
      </div>
    </div>
  );
}
