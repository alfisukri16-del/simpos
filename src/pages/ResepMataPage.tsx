import { useState } from "react";
import { CalendarDays, ChevronRight, CircleDot, Glasses, Plus, Printer } from "lucide-react";
import { RESEP_RECORDS } from "../data/mock";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import "../styles/pages.css";

export default function ResepMataPage() {
  const [selected, setSelected] = useState(RESEP_RECORDS[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Aktif" | "Expired">("Semua");
  const [notice, setNotice] = useState(false);

  const rows = RESEP_RECORDS.filter((r) => (filter === "Semua" ? true : r.status === filter)).filter((r) =>
    `${r.customer} ${r.id}`.toLowerCase().includes(query.toLowerCase()),
  );

  const rec = RESEP_RECORDS.find((r) => r.id === selected) ?? RESEP_RECORDS[0];

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <b>Kasir</b> › Resep Mata
          </>
        }
        overline="ARSIP RESEP"
        title="Resep Mata"
        desc="Arsip resep pelanggan untuk mempercepat pembuatan lensa."
        actions={
          <button className="btn btn-primary" onClick={() => setNotice(true)}>
            <Plus size={16} />
            Tambah Resep
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Total resep" value="186" caption="Tersimpan di cabang ini" icon={<Glasses size={22} />} tone="violet" />
        <StatCard label="Resep aktif" value="154" caption="Masih dapat digunakan" icon={<CalendarDays size={22} />} tone="green" />
        <StatCard label="Perlu diperbarui" value="12" caption="Resep berumur > 1 tahun" icon={<CircleDot size={22} />} tone="amber" />
      </div>

      {notice ? (
        <div className="notice">
          <CircleDot size={16} />
          Pengelolaan resep (tambah/ubah) ditangani Admin Cabang. Data di bawah adalah contoh untuk demo Kasir.
        </div>
      ) : null}

      <div className="split">
        <section className="section-block">
          <div className="section-head">
            <div>
              <h2>Daftar Resep</h2>
              <div className="section-desc">Resep terbaru per pelanggan</div>
            </div>
            <div className="section-action">
              <select className="select-pill" aria-label="Periode" defaultValue="all">
                <option value="all">Semua Periode</option>
                <option value="year">Tahun ini</option>
              </select>
            </div>
          </div>

          <div className="toolbar">
            <SearchBox placeholder="Cari nama pelanggan atau kode resep..." value={query} onChange={setQuery} />
            <div className="toolbar-chips">
              <Chip active={filter === "Semua"} onClick={() => setFilter("Semua")}>
                Semua
              </Chip>
              <Chip active={filter === "Aktif"} onClick={() => setFilter("Aktif")}>
                Aktif
              </Chip>
              <Chip active={filter === "Expired"} onClick={() => setFilter("Expired")}>
                Expired
              </Chip>
            </div>
          </div>

          <div className="table-wrap">
            <table className="tt">
              <thead>
                <tr>
                  <th>PELANGGAN</th>
                  <th>TANGGAL</th>
                  <th>OD (KANAN)</th>
                  <th>OS (KIRI)</th>
                  <th>PD</th>
                  <th>STATUS</th>
                  <th className="tt-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={selected === r.id ? "is-active" : ""}
                    onClick={() => setSelected(r.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="cell-person">
                        <Avatar initials={r.initials} size={40} />
                        <span>
                          <b>{r.customer}</b>
                          <span>{r.id}</span>
                        </span>
                      </div>
                    </td>
                    <td>{r.date}</td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        SPH {r.od.sph}
                      </div>
                      <div className="tt-sub">
                        CYL {r.od.cyl} · AX {r.od.axis}
                      </div>
                    </td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        SPH {r.os.sph}
                      </div>
                      <div className="tt-sub">
                        CYL {r.os.cyl} · AX {r.os.axis}
                      </div>
                    </td>
                    <td>{r.pd}</td>
                    <td>
                      <StatusPill label={r.status} />
                    </td>
                    <td className="tt-right">
                      <span className="link-action">
                        Detail
                        <ChevronRight size={15} />
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-note">Resep tidak ditemukan.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <div className="table-foot">
              <span className="foot-note">Menampilkan {rows.length} dari 186 resep · data demo</span>
            </div>
          </div>
        </section>

        <aside className="detail-panel">
          <div className="detail-head">
            <Avatar initials={rec.initials} size={48} />
            <div>
              <b>{rec.customer}</b>
              <span>{rec.id}</span>
            </div>
          </div>

          <div className="detail-badges">
            <StatusPill label={rec.status} />
          </div>

          <div className="detail-rows">
            <div className="detail-row">
              <span>Tanggal periksa</span>
              <b>{rec.date}</b>
            </div>
            <div className="detail-row">
              <span>PD</span>
              <b>{rec.pd}</b>
            </div>
            <div className="detail-row">
              <span>ADD</span>
              <b>{rec.add}</b>
            </div>
          </div>

          <div className="mini-label">RESEP MATA</div>
          <div className="rx-mini">
            <div className="rx-eye">
              <div className="ey-label">OD / KANAN</div>
              <b>{rec.od.sph}</b>
              <span>
                CYL {rec.od.cyl} · AXIS {rec.od.axis}
              </span>
            </div>
            <div className="rx-eye">
              <div className="ey-label">OS / KIRI</div>
              <b>{rec.os.sph}</b>
              <span>
                CYL {rec.os.cyl} · AXIS {rec.os.axis}
              </span>
            </div>
          </div>

          <button className="btn btn-primary full" onClick={() => window.print()}>
            <Printer size={16} />
            Cetak Resep
          </button>
        </aside>
      </div>
    </div>
  );
}
