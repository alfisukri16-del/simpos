import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { DEMO_ADMIN } from "../../data/admin";
import { useSharedStore } from "../../store/sharedStore";
import type { PoStatus } from "../../data/mock";
import { Avatar, Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const FILTERS: Array<"Semua" | PoStatus> = ["Semua", "Dipesan", "Diproses", "Sudah Datang", "Selesai"];

export default function AdminPemesananPage() {
  const store = useSharedStore();
  const [filter, setFilter] = useState<"Semua" | PoStatus>("Dipesan");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      store.pos
        .filter((o) => (filter === "Semua" ? true : o.status === filter))
        .filter((o) => `${o.number} ${o.customer}`.toLowerCase().includes(query.toLowerCase())),
    [store.pos, filter, query],
  );

  const baru = store.pos.filter((o) => o.status === "Dipesan").length;

  return (
    <div className="page">
      <PageHeader
        overline="OPERASIONAL — PEMESANAN"
        title="Pemesanan (PO)"
        desc={`Antrean PO dari Kasir ${DEMO_ADMIN.branch}. ${baru} PO baru menunggu diproses.`}
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari nomor PO atau nama pelanggan..." value={query} onChange={setQuery} />
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
              <th>STATUS PO</th>
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
                <td>
                  <StatusPill label={o.status} />
                </td>
                <td className="tt-right">
                  <Link className="link-action" to={`/admin/pemesanan/${o.id}`}>
                    Lihat detail
                    <ChevronRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-note">Tidak ada PO pada filter ini.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Menampilkan {rows.length} dari {store.pos.length} PO · data demo</span>
        </div>
      </div>
    </div>
  );
}
