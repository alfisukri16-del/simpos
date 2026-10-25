import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { BRANCHES, useSharedStore } from "../../store/sharedStore";
import { PageHeader, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function OwnerCabangPage() {
  const store = useSharedStore();

  const rows = BRANCHES.map((b) => {
    const stock = b.id === "pusat" ? store.centralStock : store.stock;
    const units = stock.reduce((a, s) => a + s.saldo, 0);
    const unitsOf = (type: "Frame" | "Lensa" | "Aksesoris") =>
      stock.reduce((a, s) => a + (store.productOf(s.productId)?.type === type ? s.saldo : 0), 0);
    const frame = unitsOf("Frame");
    const lensa = unitsOf("Lensa");
    const aksesoris = unitsOf("Aksesoris");
    const low = stock.filter((s) => s.saldo <= s.minimum).length;
    const sales = store.transactions.filter((t) => t.status === "Selesai" && (t.branchId ?? "cabang-padang") === b.id);
    const po = store.pos.filter((o) => (o.status === "Dipesan" || o.status === "Diproses") && o.branchId === b.id);
    const req = store.requests.filter((r) => r.branchId === b.id);
    return { b, units, frame, lensa, aksesoris, low, sales: sales.length, omzet: sales.reduce((a, t) => a + t.total, 0), po: po.length, req: req.length };
  });

  return (
    <div className="page">
      <PageHeader
        overline="MONITORING — CABANG"
        title="Monitoring Cabang"
        desc="Daftar pusat dan cabang beserta ringkasan aktivitasnya. Tanpa CRUD cabang (di luar hak yang disetujui)."
      />

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>LOKASI</th>
              <th className="tt-center">TOTAL UNIT STOK</th>
              <th className="tt-center">MENIPIS</th>
              <th className="tt-center">TRANSAKSI SUKSES</th>
              <th className="tt-center">PO AKTIF</th>
              <th className="tt-center">PENGAJUAN</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, units, frame, lensa, aksesoris, low, sales, po, req }) => (
              <tr key={b.id}>
                <td>
                  <div className="cell-person">
                    <span className="stat-icon" style={{ width: 40, height: 40, borderRadius: 13 }}>
                      <Building2 size={19} />
                    </span>
                    <span>
                      <b>{b.name}</b>
                      <span>{b.type}</span>
                    </span>
                  </div>
                </td>
                <td className="tt-center">
                  <div className="stock-cell">
                    <b>{units} Pcs</b>
                    <span>
                      Frame: {frame} | Lensa: {lensa}
                      {aksesoris > 0 ? ` | Aksesoris: ${aksesoris}` : ""}
                    </span>
                  </div>
                </td>
                <td className="tt-center">{low > 0 ? <StatusPill label="Stok Menipis" /> : <StatusPill label="Aman" />}</td>
                <td className="tt-center tt-money">{sales}</td>
                <td className="tt-center tt-money">{po}</td>
                <td className="tt-center tt-money">{req}</td>
                <td className="tt-right">
                  <Link className="link-action" to={`/owner/cabang/${b.id}`}>
                    Detail
                    <ArrowRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Pusat bukan cabang penjualan — transaksi/PO tercatat pada cabang · data demo</span>
        </div>
      </div>
    </div>
  );
}
