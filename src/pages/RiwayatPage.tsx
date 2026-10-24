import { Fragment, useState } from "react";
import { CalendarDays, ChevronDown, FileText, Printer, Receipt } from "lucide-react";
import { type TrxStatus } from "../data/mock";
import { useSharedStore } from "../store/sharedStore";
import { RESEP_MAP } from "../data/customers";
import { Avatar, Chip, PageHeader, SearchBox, StatusPill, formatIDR } from "../components/ui";
import "../styles/pages.css";

const FILTERS: Array<"Semua" | TrxStatus> = ["Semua", "Selesai", "Pending", "Dibatalkan"];
const PPN = 0.11;

export default function RiwayatPage() {
  const shared = useSharedStore();
  const [filter, setFilter] = useState<"Semua" | TrxStatus>("Semua");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("T1");

  // Riwayat dari shared store — penjualan baru Kasir ikut tercatat.
  const rows = shared.transactions.filter((t) => (filter === "Semua" ? true : t.status === filter)).filter((t) =>
    `${t.no} ${t.customer} ${t.phone}`.toLowerCase().includes(query.toLowerCase()),
  );

  const resep = RESEP_MAP["C-02"];

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <b>Kasir</b> › Riwayat Transaksi
          </>
        }
        overline="RIWAYAT TRANSAKSI"
        title="Riwayat Transaksi"
        desc="Lihat dan cari semua transaksi yang pernah dilakukan"
        actions={
          <span className="select-pill" style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
            <CalendarDays size={15} />
            01 Agu 2026 – 31 Agu 2026
          </span>
        }
      />

      <div className="toolbar">
        <SearchBox
          placeholder="Cari nomor transaksi, nama pelanggan, atau produk..."
          value={query}
          onChange={setQuery}
        />
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
              <th>NO. TRANSAKSI</th>
              <th>TANGGAL</th>
              <th>PELANGGAN</th>
              <th>JENIS</th>
              <th>TOTAL</th>
              <th>STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const open = openId === t.id;
              const subtotal = t.total;
              const tax = Math.round(subtotal * PPN);
              const label = t.detail === "resep" ? "Lihat Resep" : t.detail === "produk" ? "Lihat Semua" : "Lihat Detail";
              return (
                <Fragment key={t.id}>
                  <tr className={open ? "is-active" : ""}>
                    <td>
                      <div className="tt-num">{t.no}</div>
                      <div className="tt-sub">{t.time}</div>
                    </td>
                    <td>{t.date}</td>
                    <td>
                      <div className="tt-num" style={{ fontSize: 13 }}>
                        {t.customer}
                      </div>
                      <div className="tt-sub">{t.phone}</div>
                    </td>
                    <td>
                      <span className="type-chip">
                        {t.type === "Pembelian" ? <Receipt size={14} /> : <FileText size={14} />}
                        {t.type}
                      </span>
                    </td>
                    <td className="tt-money">{formatIDR(t.total)}</td>
                    <td>
                      <StatusPill label={t.status} />
                    </td>
                    <td className="tt-right">
                      <button className="link-action" onClick={() => setOpenId(open ? null : t.id)}>
                        {label}
                        <ChevronDown
                          size={15}
                          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}
                        />
                      </button>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="trx-expand-row">
                      <td colSpan={7} style={{ padding: "8px 10px 14px" }}>
                        <div className="trx-detail">
                          <div>
                            {t.detail === "resep" ? (
                              <>
                                <h4>Resep Mata</h4>
                                <table className="rx-table">
                                  <thead>
                                    <tr>
                                      <th>MATA</th>
                                      <th>SPH</th>
                                      <th>CYL</th>
                                      <th>AXIS</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>OD (Kanan)</td>
                                      <td>{resep.od.sph}</td>
                                      <td>{resep.od.cyl}</td>
                                      <td>{resep.od.axis}</td>
                                    </tr>
                                    <tr>
                                      <td>OS (Kiri)</td>
                                      <td>{resep.os.sph}</td>
                                      <td>{resep.os.cyl}</td>
                                      <td>{resep.os.axis}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </>
                            ) : (
                              <>
                                <h4>Detail Transaksi</h4>
                                <div className="cell-person" style={{ marginBottom: 14 }}>
                                  <Avatar initials={t.customer.slice(0, 1) + (t.customer.split(" ")[1]?.[0] ?? "")} size={40} />
                                  <span>
                                    <b>{t.customer}</b>
                                    <span>{t.phone}</span>
                                  </span>
                                </div>
                                <h4>Produk ({t.products?.length ?? 0} item)</h4>
                                <div className="sub-list">
                                  {(t.products ?? []).map((p) => (
                                    <div className="sub-row" key={p.name}>
                                      <span>
                                        <b style={{ color: "var(--ink)" }}>{p.name}</b>
                                        <br />
                                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                                          {p.brand} · {p.qty} × {formatIDR(p.price)}
                                        </span>
                                      </span>
                                      <b>{formatIDR(p.price * p.qty)}</b>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <div>
                            <h4>Ringkasan</h4>
                            <div className="sub-list">
                              <div className="sub-row">
                                <span>Subtotal</span>
                                <b>{formatIDR(subtotal)}</b>
                              </div>
                              <div className="sub-row">
                                <span>Diskon</span>
                                <b>Rp 0</b>
                              </div>
                              <div className="sub-row">
                                <span>Pajak (PPN 11%)</span>
                                <b>{formatIDR(tax)}</b>
                              </div>
                              <div className="sub-row total">
                                <span>Total</span>
                                <b>{formatIDR(subtotal + tax)}</b>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-note">Tidak ada transaksi yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="table-foot">
          <span className="foot-note">
            Menampilkan 1–{rows.length} dari 42 transaksi · data demo
          </span>
          <div className="foot-actions">
            <select className="select-pill" aria-label="Baris per halaman" defaultValue="10">
              <option value="10">10 per halaman</option>
              <option value="25">25 per halaman</option>
              <option value="50">50 per halaman</option>
            </select>
            <button className="btn btn-ghost btn-sm">
              <Printer size={15} />
              Cetak Nota
            </button>
            <button className="btn btn-ghost btn-sm">
              <FileText size={15} />
              Lihat Struk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
