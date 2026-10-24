import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { BRANCHES, useSharedStore } from "../../store/sharedStore";
import { inPeriod, periodRange, type PeriodKey } from "../../store/reports";
import { Chip, PageHeader, SearchBox, StatusPill, formatIDR } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

const PAGE = 10;
const PERIODS: PeriodKey[] = ["semua", "hari", "mingguan", "bulanan", "tahunan", "custom"];
const PERIOD_LABEL: Record<PeriodKey, string> = {
  semua: "Semua waktu",
  hari: "Hari ini",
  mingguan: "7 hari",
  bulanan: "30 hari",
  tahunan: "Tahun ini",
  custom: "Rentang",
};

export default function OwnerTransaksiPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [period, setPeriod] = useState<PeriodKey>("semua");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [detailNo, setDetailNo] = useState<string | null>(null);

  const range = periodRange(period, cFrom, cTo);

  const rows = useMemo(
    () =>
      store.transactions
        .filter((t) => (branch === "all" ? true : (t.branchId ?? "cabang-padang") === branch))
        .filter((t) => inPeriod(`${t.date}${t.time ? `, ${t.time}` : ""}`, range.from, range.to))
        .filter((t) => (status === "all" ? true : t.status === status))
        .filter((t) => (method === "all" ? true : (t.method ?? "—") === method))
        .filter((t) => `${t.no} ${t.customer}`.toLowerCase().includes(q.toLowerCase())),
    [store.transactions, branch, range.from, range.to, status, method, q],
  );

  const sukses = rows.filter((t) => t.status === "Selesai");
  const omzet = sukses.reduce((a, t) => a + t.total, 0);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice((page - 1) * PAGE, page * PAGE);
  const detail = detailNo ? store.transactions.find((t) => t.no === detailNo) : undefined;

  const resetPage = () => setPage(1);

  return (
    <div className="page">
      <PageHeader
        overline="PENGAWASAN — TRANSAKSI"
        title="Monitoring Transaksi"
        desc="Daftar transaksi Kasir read-only. Hanya status Selesai yang dihitung sebagai penjualan."
      />

      <div className="toolbar">
        <SearchBox
          placeholder="Cari nomor transaksi atau pelanggan..."
          value={q}
          onChange={(v) => {
            setQ(v);
            resetPage();
          }}
        />
        <div className="toolbar-chips">
          {PERIODS.map((k) => (
            <Chip
              key={k}
              active={period === k}
              onClick={() => {
                setPeriod(k);
                resetPage();
              }}
            >
              {PERIOD_LABEL[k]}
            </Chip>
          ))}
        </div>
        <select className="select-pill" aria-label="Cabang" value={branch} onChange={(e) => { setBranch(e.target.value); resetPage(); }}>
          <option value="all">Semua Cabang</option>
          {BRANCHES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select className="select-pill" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); resetPage(); }}>
          <option value="all">Semua Status</option>
          <option value="Selesai">Selesai</option>
          <option value="Pending">Pending</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>
        <select className="select-pill" aria-label="Metode" value={method} onChange={(e) => { setMethod(e.target.value); resetPage(); }}>
          <option value="all">Semua Metode</option>
          <option value="Tunai">Tunai</option>
          <option value="Transfer Bank">Transfer Bank</option>
          <option value="Kartu Debit/Kredit">Kartu Debit/Kredit</option>
          <option value="QRIS">QRIS</option>
        </select>
      </div>

      {period === "custom" ? (
        <div className="toolbar">
          <label className="afield" style={{ minWidth: 170 }}>
            <span>Dari tanggal</span>
            <input type="date" value={cFrom} onChange={(e) => { setCFrom(e.target.value); resetPage(); }} />
          </label>
          <label className="afield" style={{ minWidth: 170 }}>
            <span>Sampai tanggal</span>
            <input type="date" value={cTo} onChange={(e) => { setCTo(e.target.value); resetPage(); }} />
          </label>
          <span className="tt-sub" style={{ fontWeight: 600 }}>
            Batas inklusif · {range.label}
          </span>
        </div>
      ) : null}

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div className="stat-card tone-green">
          <div className="stat-body">
            <div className="stat-label">Transaksi sukses (filter aktif)</div>
            <div className="stat-value">{sukses.length}</div>
            <div className="stat-caption">dari {rows.length} baris tampil</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <div className="stat-label">Omzet sukses (filter aktif)</div>
            <div className="stat-value" style={{ fontSize: 24 }}>{formatIDR(omzet)}</div>
            <div className="stat-caption">tanpa duplikasi · {range.label}</div>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>NO. TRANSAKSI</th>
              <th>TANGGAL</th>
              <th>PELANGGAN</th>
              <th>METODE</th>
              <th className="tt-right">TOTAL</th>
              <th>STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {view.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="tt-num" style={{ fontSize: 12.5 }}>{t.no}</div>
                </td>
                <td>
                  <div className="tt-sub" style={{ marginTop: 0 }}>{t.date}{t.time ? ` · ${t.time}` : ""}</div>
                </td>
                <td>
                  <div className="tt-num" style={{ fontSize: 13 }}>{t.customer}</div>
                </td>
                <td>
                  <span className="type-chip">{t.method ?? "—"}</span>
                </td>
                <td className="tt-right tt-money">{formatIDR(t.total)}</td>
                <td>
                  <StatusPill label={t.status} />
                </td>
                <td className="tt-right">
                  <button className="link-action" onClick={() => setDetailNo(t.no)}>
                    Detail
                    <ArrowRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {view.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-note">Tidak ada transaksi pada filter ini.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Halaman {page} dari {pages} · {rows.length} transaksi</span>
          <div className="foot-actions">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Sebelumnya
            </button>
            <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {detail ? (
        <div className="overlay" onClick={() => setDetailNo(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{detail.no}</h2>
                <div className="section-desc">Read-only · Owner tidak dapat mengubah transaksi</div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setDetailNo(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="detail-rows">
              <div className="detail-row"><span>Tanggal</span><b>{detail.date}{detail.time ? ` · ${detail.time}` : ""}</b></div>
              <div className="detail-row"><span>Pelanggan</span><b>{detail.customer}</b></div>
              <div className="detail-row"><span>Metode</span><b>{detail.method ?? "—"}</b></div>
              <div className="detail-row"><span>Status</span><StatusPill label={detail.status} /></div>
              <div className="detail-row"><span>Total</span><b>{formatIDR(detail.total)}</b></div>
            </div>
            <div className="mini-label">ITEM</div>
            {(detail.products ?? []).map((p) => (
              <div key={p.name} className="todo-row">
                <div className="todo-body">
                  <b>{p.name}</b>
                  <span>{p.brand} · {p.qty} × {formatIDR(p.price)}</span>
                </div>
                <b style={{ fontSize: 13.5 }}>{formatIDR(p.qty * p.price)}</b>
              </div>
            ))}
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setDetailNo(null)}>Tutup</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
