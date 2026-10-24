import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { BRANCHES, useSharedStore } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function OwnerPengajuanPage() {
  const store = useSharedStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      store.requests
        .filter((r) => (branch === "all" ? true : r.branchId === branch))
        .filter((r) => {
          const p = store.productOf(r.productId);
          return `${r.id} ${p?.name ?? ""} ${p?.code ?? ""}`.toLowerCase().includes(q.toLowerCase());
        }),
    [store, q, branch],
  );

  const detail = detailId ? store.requests.find((r) => r.id === detailId) : undefined;
  const detailProduct = detail ? store.productOf(detail.productId) : undefined;
  const detailAlloc = detail ? store.allocatedForRequest(detail.id, detail.productId) : 0;
  const detailAvail = detailProduct ? store.availableToAllocate(detailProduct.id) : undefined;
  const detailStock = detail ? store.stock.find((s) => s.productId === detail.productId) : undefined;

  return (
    <div className="page">
      <PageHeader
        overline="KEPUTUSAN — PENGAJUAN"
        title="Pengajuan Barang"
        desc="Daftar kebutuhan dari Admin Cabang. Membuat pengajuan tidak mengubah stok mana pun."
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari ID pengajuan, produk, atau kode..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          <Chip active>Diajukan</Chip>
        </div>
        <select className="select-pill" aria-label="Cabang" value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="all">Semua Cabang</option>
          {BRANCHES.filter((b) => b.type === "Cabang").map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>ID / WAKTU</th>
              <th>CABANG</th>
              <th>PRODUK</th>
              <th className="tt-right">DIMINTA</th>
              <th className="tt-right">DIALOKASIKAN</th>
              <th className="tt-right">SISA</th>
              <th>STATUS</th>
              <th className="tt-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = store.productOf(r.productId);
              const alloc = store.allocatedForRequest(r.id, r.productId);
              const sisa = Math.max(0, r.qty - alloc);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="tt-num">{r.id}</div>
                    <div className="tt-sub">{r.at}</div>
                  </td>
                  <td>{BRANCHES.find((b) => b.id === r.branchId)?.name ?? r.branchId}</td>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {p?.name}
                    </div>
                    <div className="tt-sub">
                      {p?.type} · {p?.code}
                    </div>
                  </td>
                  <td className="tt-right tt-money">{r.qty}</td>
                  <td className="tt-right tt-money">{alloc}</td>
                  <td className="tt-right tt-money">{sisa}</td>
                  <td>
                    <StatusPill label={r.status} />
                  </td>
                  <td className="tt-right">
                    <button className="link-action" onClick={() => setDetailId(r.id)}>
                      Detail
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-note">Belum ada pengajuan pada filter ini.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">
            Sisa dihitung dari alokasi nyata (diminta − dialokasikan) · tanpa data pelanggan/resep · data demo
          </span>
        </div>
      </div>

      {detail && detailProduct ? (
        <div className="overlay" onClick={() => setDetailId(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawer-head">
              <div>
                <h2>{detail.id}</h2>
                <div className="section-desc">
                  {detail.at} · {detail.actor}
                </div>
              </div>
              <button className="icon-pill" aria-label="Tutup" onClick={() => setDetailId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="detail-rows">
              <div className="detail-row">
                <span>Produk</span>
                <b>
                  {detailProduct.name} ({detailProduct.code})
                </b>
              </div>
              <div className="detail-row">
                <span>Diminta / dialokasikan / sisa</span>
                <b>
                  {detail.qty} / {detailAlloc} / {Math.max(0, detail.qty - detailAlloc)}
                </b>
              </div>
              <div className="detail-row">
                <span>Stok cabang (min)</span>
                <b>
                  {detailStock?.saldo ?? 0} ({detailStock?.minimum ?? 0})
                </b>
              </div>
              <div className="detail-row">
                <span>Stok pusat tersedia</span>
                <b>
                  {detailAvail?.available} <span className="tt-sub">(on-hand {detailAvail?.onHand}, reservasi {detailAvail?.reserved})</span>
                </b>
              </div>
              <div className="detail-row">
                <span>Keterangan</span>
                <b>{detail.note || "—"}</b>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Tutup
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/owner/alokasi?requestId=${detail.id}`)}
              >
                Tentukan Alokasi
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
