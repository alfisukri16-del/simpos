import { useState } from "react";
import { ChevronRight, CircleDot, Glasses, MessageSquare, UserPlus, Users } from "lucide-react";
import { CUSTOMERS, RESEP_MAP } from "../data/customers";
import { Avatar, Chip, PageHeader, SearchBox, StatCard, StatusPill } from "../components/ui";
import "../styles/pages.css";

export default function PelangganPage() {
  const [selected, setSelected] = useState(CUSTOMERS[1].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Resep" | "PO">("Semua");
  const [notice, setNotice] = useState(false);

  const rows = CUSTOMERS.filter((c) => {
    if (filter === "Resep" && !c.hasResep) return false;
    if (filter === "PO" && c.poActive === 0) return false;
    return `${c.name} ${c.phone} ${c.code}`.toLowerCase().includes(query.toLowerCase());
  });

  const cust = CUSTOMERS.find((c) => c.id === selected) ?? CUSTOMERS[0];
  const resep = RESEP_MAP[cust.id];

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <b>Kasir</b> › Pelanggan
          </>
        }
        overline="PENGELOLAAN PELANGGAN"
        title="Data Pelanggan"
        desc="Cari informasi pelanggan dan kelola riwayat resep untuk pelayanan yang lebih cepat."
        actions={
          <button className="btn btn-primary" onClick={() => setNotice(true)}>
            <UserPlus size={16} />
            Tambah Pelanggan
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Total pelanggan" value="248" caption="Terdaftar di cabang ini" icon={<Users size={22} />} tone="violet" />
        <StatCard label="Pelanggan dengan resep" value="186" caption="Memiliki arsip resep" icon={<Glasses size={22} />} tone="blue" />
        <StatCard label="Pelanggan dengan PO aktif" value="12" caption="Pesanan belum selesai" icon={<MessageSquare size={22} />} tone="amber" />
      </div>

      {notice ? (
        <div className="notice">
          <CircleDot size={16} />
          Penambahan pelanggan baru belum tersedia pada demo ini — data yang tampil adalah contoh.
        </div>
      ) : null}

      <div className="split">
        <section className="section-block">
          <div className="section-head">
            <div>
              <h2>Daftar Pelanggan</h2>
              <div className="section-desc">Informasi pelanggan dan ringkasan aktivitas</div>
            </div>
            <div className="section-action">
              <span className="foot-note" style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 700 }}>
                248 data tersedia
              </span>
              <select className="select-pill" aria-label="Jenis pelanggan" defaultValue="all">
                <option value="all">Semua Pelanggan</option>
                <option value="member">Member</option>
                <option value="reguler">Reguler</option>
              </select>
            </div>
          </div>

          <div className="toolbar">
            <SearchBox placeholder="Cari nama atau nomor HP pelanggan..." value={query} onChange={setQuery} />
            <div className="toolbar-chips">
              <Chip active={filter === "Semua"} onClick={() => setFilter("Semua")}>
                Semua
              </Chip>
              <Chip active={filter === "Resep"} onClick={() => setFilter("Resep")}>
                Punya resep
              </Chip>
              <Chip active={filter === "PO"} onClick={() => setFilter("PO")}>
                PO aktif
              </Chip>
            </div>
          </div>

          <div className="table-wrap">
            <table className="tt">
              <thead>
                <tr>
                  <th>NAMA PELANGGAN</th>
                  <th>NOMOR HP</th>
                  <th>RESEP</th>
                  <th>PO AKTIF</th>
                  <th className="tt-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className={selected === c.id ? "is-active" : ""}
                    onClick={() => setSelected(c.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="cell-person">
                        <Avatar initials={c.initials} size={40} />
                        <span>
                          <b>{c.name}</b>
                          <span>{c.code}</span>
                        </span>
                      </div>
                    </td>
                    <td>{c.phone}</td>
                    <td>
                      <StatusPill label={c.hasResep ? "Ada" : "Belum ada"} />
                    </td>
                    <td>
                      <span className="tt-sub" style={{ marginTop: 0 }}>
                        {c.poActive > 0 ? `${c.poActive} pesanan` : "Tidak ada"}
                      </span>
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
                    <td colSpan={5}>
                      <div className="empty-note">Pelanggan tidak ditemukan.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="detail-panel">
          <div className="detail-head">
            <Avatar initials={cust.initials} size={48} />
            <div>
              <b>{cust.name}</b>
              <span>{cust.code}</span>
            </div>
          </div>

          <div className="detail-badges">
            <span className="tag-mini">Pelanggan terdaftar</span>
            {cust.poActive > 0 ? <span className="tag-mini">{cust.poActive} PO aktif</span> : null}
          </div>

          <div className="detail-rows">
            <div className="detail-row">
              <span>Nomor HP</span>
              <b>{cust.phone}</b>
            </div>
            <div className="detail-row">
              <span>Cabang</span>
              <b>{cust.branch}</b>
            </div>
          </div>

          <button className="btn btn-ghost full" onClick={() => setNotice(true)}>
            Edit Data
          </button>

          <div className="mini-label">DATA PELANGGAN</div>

          <div>
            <div className="mini-label" style={{ color: "var(--accent-ink)" }}>
              RESEP MATA TERAKHIR
            </div>
            <div className="detail-row">
              <span>Resep {cust.resepDate ?? "-"}</span>
              <StatusPill label={cust.hasResep ? "Tercatat" : "Belum ada"} dot={false} />
            </div>
          </div>

          {resep ? (
            <div className="rx-mini">
              <div className="rx-eye">
                <div className="ey-label">OD / KANAN</div>
                <b>{resep.od.sph}</b>
                <span>
                  CYL {resep.od.cyl} · AXIS {resep.od.axis}
                </span>
              </div>
              <div className="rx-eye">
                <div className="ey-label">OS / KIRI</div>
                <b>{resep.os.sph}</b>
                <span>
                  CYL {resep.os.cyl} · AXIS {resep.os.axis}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-note">Belum ada resep tersimpan.</div>
          )}

          <button className="btn btn-ghost full">Lihat Riwayat Resep</button>

          <div className="mini-label">AKTIVITAS TERKAIT</div>
          <div>
            <div className="act-line">
              <b>PO #PO-1024 — Diproses</b>
              <span>Menunggu ketersediaan lensa pesanan</span>
            </div>
            <div className="act-line">
              <b>Transaksi terakhir</b>
              <span>12 Agu 2026 · Rp 800.000</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
