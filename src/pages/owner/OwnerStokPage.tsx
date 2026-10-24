import { useMemo, useState } from "react";
import { BRANCHES, useSharedStore, type ProductType } from "../../store/sharedStore";
import { Chip, PageHeader, SearchBox, StatusPill } from "../../components/ui";
import "../../styles/pages.css";
import "../../styles/admin.css";

export default function OwnerStokPage() {
  const store = useSharedStore();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState<"all" | "pusat" | "cabang-padang">("all");
  const [jenis, setJenis] = useState<"Semua" | ProductType>("Semua");
  const [filter, setFilter] = useState<"Semua" | "Menipis">("Semua");

  const rows = useMemo(
    () =>
      [
        ...store.stock.map((s) => ({ ...s, loc: "cabang-padang" as const })),
        ...store.centralStock.map((s) => ({ ...s, loc: "pusat" as const })),
      ]
        .map(({ loc: l, ...s }) => ({ l, s, p: store.productOf(s.productId)! }))
        .filter(({ p }) => p && p.status === "Aktif")
        .filter(({ p }) => (jenis === "Semua" ? true : p.type === jenis))
        .filter(({ s }) => (filter === "Semua" ? true : s.saldo <= s.minimum))
        .filter(({ l }) => (loc === "all" ? true : l === loc))
        .filter(({ p }) => `${p.code} ${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())),
    [store, q, loc, jenis, filter],
  );

  return (
    <div className="page">
      <PageHeader
        overline="MONITORING — STOK"
        title="Monitoring Stok"
        desc="Stok frame/lensa per lokasi. Saldo dan minimum read-only — penyesuaian bukan hak yang disetujui."
      />

      <div className="toolbar">
        <SearchBox placeholder="Cari kode, nama, atau merek produk..." value={q} onChange={setQ} />
        <div className="toolbar-chips">
          <Chip active={filter === "Semua"} onClick={() => setFilter("Semua")}>
            Semua
          </Chip>
          <Chip active={filter === "Menipis"} onClick={() => setFilter("Menipis")}>
            Menipis
          </Chip>
        </div>
        <select className="select-pill" aria-label="Lokasi" value={loc} onChange={(e) => setLoc(e.target.value as typeof loc)}>
          <option value="all">Semua Lokasi</option>
          {BRANCHES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select className="select-pill" aria-label="Jenis" value={jenis} onChange={(e) => setJenis(e.target.value as typeof jenis)}>
          <option value="Semua">Frame + Lensa</option>
          <option value="Frame">Frame</option>
          <option value="Lensa">Lensa</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="tt">
          <thead>
            <tr>
              <th>LOKASI</th>
              <th>KODE / NAMA PRODUK</th>
              <th>JENIS</th>
              <th className="tt-right">STOK</th>
              <th className="tt-right">MINIMUM</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ l, s, p }) => {
              const low = s.saldo <= s.minimum;
              return (
                <tr key={`${l}-${p.id}`}>
                  <td>
                    <div className="tt-num" style={{ fontSize: 13 }}>
                      {l === "pusat" ? "Pusat" : "Cabang Padang"}
                    </div>
                  </td>
                  <td>
                    <div className="tt-num">{p.name}</div>
                    <div className="tt-sub">
                      {p.code} · {p.brand}
                    </div>
                  </td>
                  <td>{p.type}</td>
                  <td className="tt-right tt-money">{s.saldo}</td>
                  <td className="tt-right tt-money">{s.minimum}</td>
                  <td>
                    <StatusPill label={low ? "Stok Menipis" : "Aman"} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-note">Tidak ada stok yang cocok dengan filter.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="table-foot">
          <span className="foot-note">Menampilkan {rows.length} baris · agregat tidak menggandakan kuantitas · data demo</span>
        </div>
      </div>
    </div>
  );
}
