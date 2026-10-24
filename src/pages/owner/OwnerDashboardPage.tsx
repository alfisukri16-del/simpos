import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, Boxes, ClipboardList, FilePlus2 } from "lucide-react";
import { BRANCHES } from "../../store/sharedStore";
import { useSharedStore } from "../../store/sharedStore";
import { Chip, PageHeader, StatCard, StatusPill, formatIDR } from "../../components/ui";
import SalesBarChart from "../../components/SalesBarChart";
import "../../styles/pages.css";
import "../../styles/admin.css";

export type Scope = "all" | "pusat" | "cabang-padang";

export function scopeLabel(s: Scope) {
  return s === "all" ? "Semua Lokasi" : BRANCHES.find((b) => b.id === s)?.name ?? s;
}

export function useOwnerScope(scope: Scope) {
  const store = useSharedStore();
  return useMemo(() => {
    const inScope = (branchId?: string) => scope === "all" || branchId === scope;
    const pusatOnly = scope === "pusat";
    const tx = store.transactions.filter((t) => t.status === "Selesai" && inScope(t.branchId ?? "cabang-padang"));
    const poActive = store.pos.filter((o) => (o.status === "Dipesan" || o.status === "Diproses") && (pusatOnly ? false : inScope(o.branchId)));
    const reqs = store.requests.filter((r) => (pusatOnly ? false : inScope(r.branchId)));
    const rows = [
      ...store.stock.map((s) => ({ ...s, loc: "cabang-padang" })),
      ...store.centralStock.map((s) => ({ ...s, loc: "pusat" })),
    ].filter((s) => inScope(s.loc));
    const low = rows.filter((s) => {
      const p = store.productOf(s.productId);
      return p && p.status === "Aktif" && s.saldo <= s.minimum;
    });
    return { tx, poActive, reqs, rows, low };
  }, [store, scope]);
}

const SCOPES: Scope[] = ["all", "pusat", "cabang-padang"];

/* Tanggal transaksi disimpan sebagai "24 Okt 2026" (id-ID), jadi diparse manual. */
const MONTH_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
  Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

function parseTrxDate(s: string): Date | null {
  const [d, m, y] = s.trim().split(/\s+/);
  const day = Number(d);
  const month = MONTH_IDX[m];
  const year = Number(y);
  if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return null;
  return new Date(year, month, day);
}

export default function OwnerDashboardPage() {
  const store = useSharedStore();
  const [scope, setScope] = useState<Scope>("all");
  const { tx, poActive, reqs, low } = useOwnerScope(scope);
  const total = tx.reduce((a, t) => a + t.total, 0);

  const cabangRows = BRANCHES.map((b) => {
    const bTx = store.transactions.filter((t) => t.status === "Selesai" && (t.branchId ?? "cabang-padang") === b.id);
    const bPo = store.pos.filter((o) => (o.status === "Dipesan" || o.status === "Diproses") && o.branchId === b.id);
    const bLow = (b.id === "pusat" ? store.centralStock : store.stock).filter((s) => s.saldo <= s.minimum).length;
    return { b, sales: bTx.length, po: bPo.length, low: bLow };
  }).filter(({ b }) => scope === "all" || b.id === scope);

  /* Tren omzet per tanggal transaksi — 8 tanggal terakhir pada cakupan aktif. */
  const chart = useMemo(() => {
    const perDate = new Map<string, { at: Date; value: number; count: number }>();
    for (const t of tx) {
      const at = parseTrxDate(t.date);
      if (!at) continue;
      const cur = perDate.get(t.date) ?? { at, value: 0, count: 0 };
      cur.value += t.total;
      cur.count += 1;
      perDate.set(t.date, cur);
    }
    const sorted = [...perDate.values()].sort((a, b) => a.at.getTime() - b.at.getTime()).slice(-8);
    const points = sorted.map((p) => ({
      key: p.at.toISOString(),
      label: p.at.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      full: p.at.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
      value: p.value,
      count: p.count,
    }));
    const sum = points.reduce((a, p) => a + p.value, 0);
    return { points, sum, avg: points.length ? Math.round(sum / points.length) : 0 };
  }, [tx]);

  return (
    <div className="page">
      <PageHeader
        overline="DASHBOARD PEMILIK"
        title="Dashboard Pemilik"
        desc="Ringkasan konsolidasi dari sumber data yang sama dengan Kasir dan Admin. Klik angka untuk menelusuri daftar asalnya."
      />

      <div className="toolbar">
        <div className="toolbar-chips">
          {SCOPES.map((s) => (
            <Chip key={s} active={scope === s} onClick={() => setScope(s)}>
              {scopeLabel(s)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <div className="stat-card tone-green">
          <div className="stat-body">
            <div className="stat-label">Transaksi Sukses</div>
            <div className="stat-value">{tx.length}</div>
            <div className="stat-caption">{formatIDR(total)}</div>
          </div>
          <span className="stat-icon">
            <Banknote size={22} />
          </span>
        </div>
        <div className="stat-card tone-blue">
          <div className="stat-body">
            <div className="stat-label">PO Aktif</div>
            <div className="stat-value">{poActive.length}</div>
            <div className="stat-caption">Dipesan + Diproses</div>
          </div>
          <span className="stat-icon">
            <ClipboardList size={22} />
          </span>
        </div>
        <Link to="/owner/stok" className="stat-link">
          <StatCard
            label="Stok Menipis"
            value={String(low.length)}
            caption="Saldo ≤ minimum"
            icon={<Boxes size={22} />}
            tone="amber"
          />
        </Link>
        <div className="stat-card tone-violet">
          <div className="stat-body">
            <div className="stat-label">Pengajuan Baru</div>
            <div className="stat-value">{reqs.length}</div>
            <div className="stat-caption">Menunggu tinjauan</div>
          </div>
          <span className="stat-icon">
            <FilePlus2 size={22} />
          </span>
        </div>
      </div>

      <section className="panel sales-chart">
        <div className="section-head">
          <div>
            <h2>Tren Penjualan</h2>
            <div className="section-desc">
              Omzet transaksi selesai per tanggal · {scopeLabel(scope)}
            </div>
          </div>
          <div className="chart-figures">
            <div>
              <span>Total</span>
              <b>{formatIDR(chart.sum)}</b>
            </div>
            <div>
              <span>Rata-rata</span>
              <b>{formatIDR(chart.avg)}</b>
            </div>
          </div>
        </div>

        {chart.points.length === 0 ? (
          <div className="empty-note">Belum ada transaksi selesai pada cakupan ini.</div>
        ) : (
          <SalesBarChart
            points={chart.points}
            yTitle="Omzet (Rp)"
            xTitle="Tanggal Transaksi"
          />
        )}
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Pengajuan Terbaru</h2>
              <div className="section-desc">Dari Admin Cabang — alokasi menyusul tahap berikutnya</div>
            </div>
          </div>
          <div className="todo-list">
            {reqs.slice(0, 5).map((r) => {
              const p = store.productOf(r.productId);
              return (
                <div key={r.id} className="todo-row">
                  <div className="todo-body">
                    <b>
                      {p?.name} × {r.qty}
                    </b>
                    <span>
                      {r.id} · {r.at}
                    </span>
                  </div>
                  <StatusPill label={r.status} />
                </div>
              );
            })}
            {reqs.length === 0 ? <div className="empty-note">Tidak ada pengajuan pada cakupan ini.</div> : null}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Ringkasan Lokasi</h2>
              <div className="section-desc">Pusat + cabang</div>
            </div>
            <Link className="link-action" to="/owner/cabang">
              Semua cabang
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="todo-list">
            {cabangRows.map(({ b, sales, po, low: l }) => (
              <div key={b.id} className="todo-row">
                <div className="todo-body">
                  <b>{b.name}</b>
                  <span>
                    {b.type} · {sales} transaksi · {po} PO aktif · {l} menipis
                  </span>
                </div>
                <Link className="link-action" to={`/owner/cabang/${b.id}`}>
                  Detail
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <span className="foot-note">Angka dihitung dari data aktual {scopeLabel(scope)} · data demo.</span>
    </div>
  );
}
